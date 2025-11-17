import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { isIOS } from "@consts";
import type { RecoverScreenProps } from "@src/nav/navTypes";
import { NS } from "@src/i18n";
import { useKnownMints } from "@src/context/KnownMints";
import { seedService } from "@src/services/SeedService";
import { createRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, type TextInput, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function RecoverScreen({ navigation }: RecoverScreenProps) {
  const { t } = useTranslation([NS.common]);
  const [input, setInput] = useState("");
  const { loading } = useLoading();
  const inputRef = createRef<TextInput>();
  const { knownMints } = useKnownMints();

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
    >
      <View style={styles.container}>
        <View style={{ paddingHorizontal: s(20) }}>
          <Txt txt={t("recoveryHint")} styles={[styles.hint]} bold />
          <TxtInput
            autoCapitalize="none"
            multiline
            innerRef={inputRef}
            placeholder={t("12WordMnemonic")}
            onChangeText={(text) => setInput(text)}
            onSubmitEditing={() => void handleBtnPress()}
            autoFocus
            ms={200}
            style={[styles.multilineInput]}
          />
        </View>
        <KeyboardAvoidingView
          behavior={isIOS ? "padding" : undefined}
          style={styles.actionWrap}
        >
          <Button
            disabled={!input.length}
            txt={t("confirm")}
            onPress={() => void handleBtnPress()}
            icon={loading ? <Loading size={20} /> : undefined}
          />
          {isIOS && <View style={styles.placeholder} />}
        </KeyboardAvoidingView>
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
    paddingHorizontal: "20@s",
    width: "100%",
  },
  hint: {
    marginBottom: "20@vs",
  },
  actionWrap: {
    paddingHorizontal: "20@s",
    marginBottom: isIOS ? "0@s" : "20@s",
  },
  placeholder: {
    height: "100@vs",
  },
  multilineInput: {
    minHeight: "80@s",
    borderRadius: 25,
    padding: "10@s",
  },
});
