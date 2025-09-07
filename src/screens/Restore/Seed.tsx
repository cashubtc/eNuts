import Button, { TxtButton } from "@comps/Button";
import {
  BackupIcon,
  BoltIcon,
  ExclamationIcon,
  ExitIcon,
  InfoIcon,
  LeafIcon,
  LeftArrow,
} from "@comps/Icons";
import MyModal from "@comps/modal";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { getMints } from "@db";
import type { ISeedPageProps } from "@model/nav";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { globals, mainColors } from "@styles";
import { H_Colors } from "@styles/colors";
import { incrementCounterByMintUrl } from "@wallet";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

const incrementValue = 50;

export default function SeedScreen({ navigation }: ISeedPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();

  return (
    <Screen screenName={t("seedBackup")} noIcons>
      <View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
        <>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Mnemonic", {
                comingFromOnboarding: true,
              });
            }}
          >
            <View style={styles.action}>
              <View style={styles.optionIcon}>
                <LeafIcon
                  width={s(22)}
                  height={s(22)}
                  color={mainColors.VALID}
                />
              </View>
              <View>
                <Txt txt={t("secureWallet")} bold />
                <Txt
                  txt={t("secureWalletHint")}
                  styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
                />
              </View>
            </View>
          </TouchableOpacity>
          <Separator style={[styles.separator]} />
        </>
        <TouchableOpacity
          onPress={() => {
            void store.set(STORE_KEYS.sawSeedUpdate, "1");
            navigation.navigate("Restore warning", {
              comingFromOnboarding: true,
            });
          }}
        >
          <View style={styles.action}>
            <View style={styles.optionIcon}>
              <BackupIcon width={s(21)} height={s(21)} color={H_Colors.Nuts} />
            </View>
            <View>
              <Txt txt={t("walletRecovery")} bold />
              <Txt
                txt={t("walletRecoveryHint")}
                styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  wrapContainer: {
    borderRadius: 20,
    paddingVertical: "20@vs",
    marginBottom: "20@vs",
    paddingRight: "40@s",
  },
  header: {
    height: "35%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
  },
  headerTxt: {
    fontSize: "30@s",
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navIcon: {
    padding: "20@s",
  },
  optionIcon: {
    minWidth: "40@s",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "20@s",
    width: "100%",
  },
  separator: {
    width: "100%",
    marginTop: "20@vs",
    marginHorizontal: "20@s",
  },
  txtBtn: {
    paddingBottom: "20@s",
  },
});
