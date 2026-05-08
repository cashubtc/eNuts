import { AppText, InputFrame, useAppThemeTokens, Stack } from "@styles";
import Button, { TxtButton } from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import type { RecoverScreenProps } from "@src/nav/navTypes";
import { NS } from "@src/i18n";
import { useKnownMints } from "@src/context/KnownMints";
import { seedService } from "@src/services/SeedService";
import { getStrFromClipboard } from "@util";
import { createRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type TextInput, StyleSheet } from "react-native";
export default function RecoverScreen({ navigation }: RecoverScreenProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
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
      <Stack style={styles.container}>
        <Stack style={{ paddingHorizontal: 8 }}>
          <AppText style={[styles.hint]} weight="medium" testID={`${t("recoveryHint")}-txt`}>
            {t("recoveryHint")}
          </AppText>
          <Stack style={styles.labelRow}>
            <AppText style={[styles.label]} testID={`${t("12WordMnemonic")}-txt`}>
              {t("12WordMnemonic")}
            </AppText>
            <TxtButton
              txt={t("paste")}
              onPress={() => void handlePaste()}
              style={[styles.pasteBtn]}
            />
          </Stack>
          <InputFrame
            autoCapitalize="none"
            multiline
            ref={inputRef}
            placeholder=""
            placeholderTextColor={theme.placeholder as never}
            selectionColor={theme.accent}
            cursorColor={theme.accent}
            onChangeText={(text) => setInput(text)}
            onSubmitEditing={() => void handleBtnPress()}
            style={[styles.multilineInput]}
            testID="-input"
            value={input}
          />
        </Stack>
        <Stack style={styles.actionWrap}>
          <Button
            disabled={!input.length}
            txt={t("confirm")}
            onPress={() => void handleBtnPress()}
            icon={loading ? <Loading size={20} /> : undefined}
          />
        </Stack>
      </Stack>
    </Screen>
  );
}
const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    flex: 1,
  },
  pasteBtn: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  actionWrap: {
    marginBottom: 20,
  },
  multilineInput: {
    minHeight: 80,
    borderRadius: 25,
    padding: 10,
  },
});
