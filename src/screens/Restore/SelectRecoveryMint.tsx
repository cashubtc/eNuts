import Button, { TxtButton } from "@comps/Button";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { isIOS } from "@consts";
import type { ISelectRecoveryMintPageProps } from "@model/nav";
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
  const { color } = useThemeContext();

  const [input, setInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const handleAdd = () => {
    const submitted = normalizeMintUrl(input.trim());
    if (!submitted?.length) {
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
    <Screen
      screenName={t("walletRecovery")}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={{ paddingHorizontal: s(20) }}>
        <Txt txt={t("selectRestoreMint")} styles={[styles.hint]} bold />
        <TxtInput
          autoCapitalize="none"
          placeholder="Mint URL"
          value={input}
          onChangeText={(text) => setInput(text)}
          onSubmitEditing={() => void handleAdd()}
          ms={200}
        />
        <View style={{ marginTop: s(10) }}>
          <Button
            disabled={!input.length}
            txt={t("add")}
            onPress={() => void handleAdd()}
          />
        </View>
      </View>
      <ScrollView
        alwaysBounceVertical={false}
        style={{ marginBottom: s(90), marginTop: s(20) }}
      >
        <View style={[globals(color).wrapContainer, { paddingBottom: s(20) }]}>
          {urls.map((url, i) => (
            <View key={`${url}-${i}`} style={styles.rowWrap}>
              <Txt txt={url} />
              <TxtButton txt={t("delete")} onPress={() => handleDelete(i)} />
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.btn, { backgroundColor: color.BACKGROUND }]}>
        <View style={styles.btnWrap}>
          <Button
            disabled={!selected}
            txt={t("confirm")}
            onPress={() => {
              if (!selected) {
                return;
              }
              navigation.navigate("Recover", {
                mintUrl: selected,
                comingFromOnboarding: route.params?.comingFromOnboarding,
              });
            }}
          />
        </View>
      </View>
    </Screen>
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
