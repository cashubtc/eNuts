import Button, { IconBtn, TxtButton } from "@comps/Button";
import { highlight as hi } from "@styles";
import { PlusIcon, TrashbinIcon } from "@comps/Icons";
import Screen, { ScreenWithKeyboard } from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { isIOS } from "@consts";
import type { ISelectRecoveryMintPageProps } from "@model/nav";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { normalizeMintUrl } from "@util";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function SelectRecoveryMintScreen({
  navigation,
  route,
}: ISelectRecoveryMintPageProps) {
  const { t } = useTranslation([NS.common]);
  const { highlight, color, pref } = useThemeContext();

  const [input, setInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { openPromptAutoClose } = usePromptContext();

  const handleAdd = () => {
    const submitted = normalizeMintUrl(input.trim());
    if (!submitted?.length) {
      openPromptAutoClose({ msg: t("invalidUrl", { ns: NS.mints }), ms: 1500 });
      return;
    }
    setUrls((prev) => [...prev, submitted]);
    setSelected(submitted);
    setInput("");
  };

  const handleDelete = (index: number) => {
    setUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (selected && selected === prev[index]) {
        setSelected(next.length ? next[next.length - 1] : null);
      }
      return next;
    });
  };

  return (
    <ScreenWithKeyboard
      screenName={t("walletRecovery")}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={{ flex: 1, gap: s(10) }}>
        <Txt txt={t("selectRestoreMint")} styles={[styles.hint]} bold />
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: s(12) }}
        >
          <View style={{ flex: 1 }}>
            <TxtInput
              autoCapitalize="none"
              placeholder="Mint URL"
              value={input}
              onChangeText={(text) => setInput(text)}
              onSubmitEditing={() => void handleAdd()}
            />
          </View>
          <IconBtn
            icon={<PlusIcon color="white" width={s(20)} height={s(20)} />}
            onPress={() => void handleAdd()}
            disabled={!input.length}
          />
        </View>
        <ScrollView alwaysBounceVertical={false}>
          <Button
            disabled={urls.length === 0}
            txt={t("confirm")}
            onPress={() => {
              if (urls.length === 0) {
                return;
              }
              navigation.navigate("Recover", {
                mintUrl: urls[0],
                comingFromOnboarding: route.params?.comingFromOnboarding,
              });
            }}
          />
          <View style={[globals(color).wrapContainer, { marginTop: 10 }]}>
            {urls.map((url, i) => (
              <View key={`${url}-${i}`} style={styles.rowWrap}>
                <Txt txt={url} />
                <IconBtn
                  outlined
                  icon={
                    <TrashbinIcon
                      width={s(20)}
                      height={s(20)}
                      color={hi[highlight]}
                    />
                  }
                  size={s(40)}
                  onPress={() => handleDelete(i)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenWithKeyboard>
  );
}

const styles = ScaledSheet.create({
  hint: {
    paddingHorizontal: "20@s",
    marginBottom: "20@vs",
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    position: "absolute",
    right: 0,
    bottom: isIOS ? "0@s" : "20@s",
    left: 0,
  },
  btnWrap: {
    marginHorizontal: "20@s",
    marginTop: "20@s",
  },
});
