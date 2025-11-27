import {
  GithubIcon,
  HistoryIcon,
  LanguageIcon,
  KeyIcon,
  LockIcon,
  MintBoardIcon,
  NfcIcon,
  PaletteIcon,
  SettingsIcon,
  SwapCurrencyIcon,
} from "@comps/Icons";
import type { TSettingsPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { dropAllData } from "@src/storage/dev";
import { appVersion } from "@src/consts/env";
import { secureStore, store } from "@store";
import { SECURESTORE_KEY, STORE_KEYS } from "@store/consts";
import { globals } from "@styles";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { s, vs } from "react-native-size-matters";
import ConfirmBottomSheet, {
  ConfirmBottomSheetRef,
} from "@comps/modal/ConfirmBottomSheet";

import MenuItem from "./MenuItem";
import Loading from "@comps/Loading";

export default function Settings({ navigation }: TSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
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
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header={t("mint")}
            txt={t("mintSettings", { ns: NS.topNav })}
            icon={<MintBoardIcon color={color.TEXT} />}
            onPress={() => navigation.navigate("Mint", { screen: "MintHome" })}
          />
        </View>
        {/* WALLET */}
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header={t("wallet")}
            txt={t("history", { ns: NS.topNav })}
            icon={<HistoryIcon color={color.TEXT} />}
            onPress={() =>
              navigation.navigate("History", { screen: "HistoryMain" })
            }
          />
        </View>
        {/* PREFERENCES */}
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header={t("preferences")}
            txt={t("display")}
            icon={<PaletteIcon color={color.TEXT} />}
            onPress={() => navigation.navigate("Display settings")}
          />
          <MenuItem
            txt={t("language")}
            icon={<LanguageIcon color={color.TEXT} />}
            onPress={() => navigation.navigate("Language settings")}
          />
          <MenuItem
            txt={t("currency")}
            icon={<SwapCurrencyIcon color={color.TEXT} />}
            onPress={() => navigation.navigate("Currency settings")}
          />
          <MenuItem
            txt={t("nfcSettings", { defaultValue: "NFC Payments" })}
            icon={<NfcIcon width={s(18)} color={color.TEXT} />}
            onPress={() => navigation.navigate("NFC settings")}
          />
        </View>
        {/* SECURITY */}
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header={t("restore")}
            txt={t("viewMnemonic")}
            icon={<KeyIcon color={color.TEXT} />}
            onPress={() => navigation.navigate("View mnemonic")}
          />
          <MenuItem
            txt={t("restore")}
            icon={<LockIcon color={color.TEXT} />}
            onPress={() =>
              navigation.navigate("Restore", { screen: "RecoverMints" })
            }
          />
        </View>
        {/* ABOUT */}
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header={t("about")}
            txt={t("github")}
            icon={<GithubIcon color={color.TEXT} />}
            onPress={() => {}}
          />
        </View>
        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          <MenuItem
            header="DEV"
            txt={t("factoryReset")}
            icon={<Text>💥💥💥</Text>}
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
        </View>
        <Txt txt={appVersion} bold center />
      </ScrollView>
      <ConfirmBottomSheet ref={confirmSheetRef} />
    </Screen>
  );
}
