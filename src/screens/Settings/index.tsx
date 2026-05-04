import {
  GithubIcon,
  HistoryIcon,
  LanguageIcon,
  KeyIcon,
  LinkIcon,
  LockIcon,
  MintBoardIcon,
  NfcIcon,
  PaletteIcon,
  SettingsIcon,
  SwapCurrencyIcon,
  ZapIcon,
} from "@comps/Icons";
import type { TSettingsPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { dropAllData } from "@src/storage/dev";
import { appVersion } from "@src/consts/env";
import { reportIssueUrl } from "@src/consts/urls";
import { isErr, openUrl } from "@util";
import { secureStore, store } from "@store";
import { SECURESTORE_KEY, STORE_KEYS } from "@store/consts";
import { AppText, globals, useAppThemeTokens, Stack } from "@styles";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import ConfirmBottomSheet, { ConfirmBottomSheetRef } from "@comps/modal/ConfirmBottomSheet";
import MenuItem from "./MenuItem";
import Loading from "@comps/Loading";
export default function Settings({ navigation }: TSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const theme = useAppThemeTokens();
  const confirmSheetRef = useRef<ConfirmBottomSheetRef>(null);
  const handleReset = async () => {
    try {
      await dropAllData();
    } catch {
      /* ignore */
    }
  };
  return (
    <Screen
      screenName={t("settings", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView alwaysBounceVertical={false}>
        {/* MINT */}
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header={t("mint")}
            txt={t("mintSettings", { ns: NS.topNav })}
            icon={<MintBoardIcon color={theme.text} />}
            onPress={() => navigation.navigate("Mint", { screen: "MintHome" })}
          />
        </Stack>
        {/* WALLET */}
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header={t("wallet")}
            txt={t("history", { ns: NS.topNav })}
            icon={<HistoryIcon color={theme.text} />}
            onPress={() => navigation.navigate("History", { screen: "HistoryMain" })}
          />
        </Stack>
        {/* PREFERENCES */}
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header={t("preferences")}
            txt={t("display")}
            icon={<PaletteIcon color={theme.text} />}
            onPress={() => navigation.navigate("Display settings")}
          />
          <MenuItem
            txt={t("language")}
            icon={<LanguageIcon color={theme.text} />}
            onPress={() => navigation.navigate("Language settings")}
          />
          <MenuItem
            txt={t("currency")}
            icon={<SwapCurrencyIcon color={theme.text} />}
            onPress={() => navigation.navigate("Currency settings")}
          />
          <MenuItem
            txt={t("nfcSettings", { defaultValue: "NFC Payments" })}
            icon={<NfcIcon width={18} color={theme.text} />}
            onPress={() => navigation.navigate("NFC settings")}
          />
          <MenuItem
            txt={t("npcSettings", { defaultValue: "Lightning address" })}
            icon={<ZapIcon width={18} color={theme.text} />}
            onPress={() => navigation.navigate("NPC settings")}
          />
        </Stack>
        {/* SECURITY */}
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header={t("restore")}
            txt={t("viewMnemonic")}
            icon={<KeyIcon color={theme.text} />}
            onPress={() => navigation.navigate("View mnemonic")}
          />
          <MenuItem
            txt={t("restore")}
            icon={<LockIcon color={theme.text} />}
            onPress={() => navigation.navigate("Restore", { screen: "RecoverMints" })}
          />
        </Stack>
        {/* ABOUT */}
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header={t("about")}
            txt={t("github")}
            icon={<GithubIcon color={theme.text} />}
            onPress={() => {}}
          />
          <MenuItem
            txt={t("reportIssue", { defaultValue: "Report an issue" })}
            icon={<LinkIcon color={theme.text} />}
            onPress={() =>
              void openUrl(reportIssueUrl)?.catch((err: unknown) =>
                openPromptAutoClose({
                  msg: isErr(err) ? err.message : t("deepLinkErr", { ns: NS.common }),
                }),
              )
            }
          />
        </Stack>
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 20 }]}
        >
          <MenuItem
            header="DEV"
            txt={t("factoryReset")}
            icon={<AppText>💥💥💥</AppText>}
            onPress={() =>
              confirmSheetRef.current?.open({
                header: t("resetQ"),
                txt: t("delHistoryTxt"),
                confirmTxt: t("confirmReset"),
                cancelTxt: t("back"),
                onConfirm: () => void handleReset(),
                onCancel: () => {},
                destructive: true,
              })
            }
          />
        </Stack>
        <AppText weight="medium" align="center" testID={`${appVersion}-txt`}>
          {appVersion}
        </AppText>
      </ScrollView>
      <ConfirmBottomSheet ref={confirmSheetRef} />
    </Screen>
  );
}
