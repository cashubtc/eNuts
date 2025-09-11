import Button, { IconBtn } from "@comps/Button";
import { highlight as hi } from "@styles";
import { PlusIcon, TrashbinIcon } from "@comps/Icons";
import { ScreenWithKeyboard } from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { isIOS } from "@consts";
import type { RecoverMintsScreenProps } from "@src/nav/navTypes";
import { useManager } from "@src/context/Manager";
import { useKnownMints } from "@src/context/KnownMints";
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
}: RecoverMintsScreenProps) {
  const { t } = useTranslation([NS.common]);
  const { highlight, color } = useThemeContext();

  const [input, setInput] = useState("");
  const { knownMints } = useKnownMints();
  const manager = useManager();
  const { openPromptAutoClose } = usePromptContext();

  const handleAdd = async () => {
    const submitted = normalizeMintUrl(input.trim());
    if (!submitted?.length) {
      openPromptAutoClose({ msg: t("invalidUrl", { ns: NS.mints }), ms: 1500 });
      return;
    }
    await manager.mint.addMint(submitted);

    setInput("");
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
            disabled={knownMints.length === 0}
            txt={t("confirm")}
            onPress={() => {
              navigation.navigate("Recover");
            }}
          />
          {knownMints.length > 0 && (
            <View style={[globals(color).wrapContainer, { marginTop: 10 }]}>
              {knownMints.map((mint, i) => (
                <View key={`${mint.mintUrl}-${i}`} style={styles.rowWrap}>
                  <Txt txt={mint.mintUrl} />
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
                    onPress={() => {
                      //TODO: Add delete
                    }}
                  />
                </View>
              ))}
            </View>
          )}
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
