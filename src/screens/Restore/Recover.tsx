import Button, { TxtButton } from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import type { RecoverScreenProps } from "@src/nav/navTypes";
import { NS } from "@src/i18n";
import { useKnownMints } from "@src/context/KnownMints";
import { seedService } from "@src/services/SeedService";
import { getStrFromClipboard } from "@util";
import { createRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type TextInput, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function RecoverScreen({ navigation }: RecoverScreenProps) {
  const { t } = useTranslation([NS.common]);
  const [input, setInput] = useState("");
  const { loading } = useLoading();
  const inputRef = createRef<TextInput>();
  const { knownMints } = useKnownMints();

  const handlePaste = async () => {
    const clipboard = await getStrFromClipboard();
    if (!clipboard) {
      return;
    }
    setInput(clipboard);
  };

  const handleBtnPress = async () => {
    if (loading || !input.length) {
      return;
    }
    const seed = seedService.convertMnemonicToSeed(input);

    navigation.navigate("Recovering", {
      bip39seed: seed,
      mintUrls: knownMints.map((mint) => mint.mintUrl),
    });
  };

  // auto-focus keyboard
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      clearTimeout(t);
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      screenName={t("walletRecovery")}
      withBackBtn
      handlePress={() => navigation.goBack()}
      withKeyboard={true}
    >
      <View style={styles.container}>
        <View style={{ paddingHorizontal: s(8) }}>
          <Txt txt={t("recoveryHint")} styles={[styles.hint]} bold />
          <View style={styles.labelRow}>
            <Txt txt={t("12WordMnemonic")} styles={[styles.label]} />
            <TxtButton
              txt={t("paste")}
              onPress={() => void handlePaste()}
              style={[styles.pasteBtn]}
            />
          </View>
          <TxtInput
            autoCapitalize="none"
            multiline
            innerRef={inputRef}
            placeholder=""
            onChangeText={(text) => setInput(text)}
            onSubmitEditing={() => void handleBtnPress()}
            autoFocus
            ms={200}
            style={[styles.multilineInput]}
            value={input}
          />
        </View>
        <View style={styles.actionWrap}>
          <Button
            disabled={!input.length}
            txt={t("confirm")}
            onPress={() => void handleBtnPress()}
            icon={loading ? <Loading size={20} /> : undefined}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  hint: {
    marginBottom: "20@vs",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8@vs",
  },
  label: {
    flex: 1,
  },
  pasteBtn: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  actionWrap: {
    marginBottom: "20@s",
  },
  multilineInput: {
    minHeight: "80@s",
    borderRadius: 25,
    padding: "10@s",
  },
});
