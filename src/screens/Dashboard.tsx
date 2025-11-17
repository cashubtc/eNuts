import { Token } from "@cashu/cashu-ts";
import Balance from "@comps/Balance";
import { IconBtn } from "@comps/Button";
import DashboardTopBar from "@comps/DashboardTopBar";
import useLoading from "@comps/hooks/Loading";
import { PlusIcon, ReceiveIcon, ScanQRIcon, SendIcon } from "@comps/Icons";
import BottomSheetOptionsModal from "@comps/modal/BottomSheetOptionsModal";
import Txt from "@comps/Txt";
import BottomSheet from "@gorhom/bottom-sheet";
import { _testmintUrl, env } from "@consts";
import type { TBeforeRemoveEvent, TDashboardPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { highlight as hi, mainColors } from "@styles";
import { getStrFromClipboard } from "@util";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";

export default function Dashboard({ navigation }: TDashboardPageProps) {
  const { t } = useTranslation([NS.common]);
  // Theme
  const { color, highlight } = useThemeContext();
  // Loading state
  const { loading, startLoading, stopLoading } = useLoading();
  // Prompt modal
  const { openPromptAutoClose } = usePromptContext();
  const { knownMints } = useKnownMints();
  const sendOptionsRef = useRef<BottomSheet>(null);
  const receiveOptionsRef = useRef<BottomSheet>(null);
  const { claimFromTokenString, isReceiving } = useCashuClaimFlow();

  const handleClaimBtnPress = async () => {
    if (loading) {
      return;
    }
    startLoading();
    const clipboard = await getStrFromClipboard();
    try {
      if (!clipboard) {
        throw new Error("Clipboard is empty");
      }
      await claimFromTokenString(clipboard);
    } catch (e) {
      openPromptAutoClose({ msg: t("clipboardInvalid") });
      stopLoading();
      return;
    }
    stopLoading();
  };

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
      {/* Dashboard top bar */}
      <DashboardTopBar
        onSettingsPress={() =>
          navigation.navigate("Settings", { screen: "SettingsMain" })
        }
      />
      {/* Balance section - takes 2/3 of available space */}
      <View style={styles.balanceSection}>
        <Balance nav={navigation} />
      </View>
      {/* Action buttons section - takes 1/3 of available space */}
      <View style={styles.actionsSection}>
        <View style={[styles.actionWrap, { paddingHorizontal: s(20) }]}>
          {/* Send button or add first mint */}
          {knownMints.length > 0 ? (
            <ActionBtn
              icon={
                <SendIcon width={s(32)} height={s(32)} color={hi[highlight]} />
              }
              txt={t("send", { ns: NS.wallet })}
              color={hi[highlight]}
              onPress={() => {
                sendOptionsRef.current?.snapToIndex(0);
              }}
            />
          ) : (
            <ActionBtn
              icon={
                <PlusIcon width={s(36)} height={s(36)} color={hi[highlight]} />
              }
              txt={t("mint")}
              color={hi[highlight]}
              onPress={() => {
                navigation.navigate("Mint", { screen: "MintHome" });
              }}
            />
          )}
          <ActionBtn
            icon={
              <ScanQRIcon width={s(32)} height={s(32)} color={hi[highlight]} />
            }
            txt={t("scan")}
            color={hi[highlight]}
            onPress={() => navigation.navigate("QRScanner")}
          />
          <ActionBtn
            icon={
              <ReceiveIcon width={s(32)} height={s(32)} color={hi[highlight]} />
            }
            txt={t("receive", { ns: NS.wallet })}
            color={hi[highlight]}
            disabled={isReceiving}
            onPress={() => {
              // if (!hasMint) {
              //     // try to claim from clipboard to avoid receive-options-modal to popup and having to press again
              //     return handleClaimBtnPress();
              // }
              receiveOptionsRef.current?.snapToIndex(0);
            }}
          />
        </View>
      </View>
      {/* Send options bottom sheet */}
      <BottomSheetOptionsModal
        ref={sendOptionsRef}
        button1Txt={t("sendEcash")}
        onPressFirstBtn={() => {
          navigation.navigate("SendSelectAmount");
        }}
        button2Txt={t("payLNInvoice", { ns: NS.wallet })}
        onPressSecondBtn={() => {
          navigation.navigate("MeltInput", {});
        }}
        onPressCancel={() => {}}
        isSend
      />
      {/* Receive options bottom sheet */}
      <BottomSheetOptionsModal
        ref={receiveOptionsRef}
        button1Txt={
          loading
            ? t("claiming", { ns: NS.wallet })
            : t("pasteToken", { ns: NS.wallet })
        }
        onPressFirstBtn={() => void handleClaimBtnPress()}
        button2Txt={t("createLnInvoice")}
        onPressSecondBtn={() => {
          navigation.navigate("MintSelectAmount");
        }}
        onPressCancel={() => {}}
        loading={loading}
      />
    </View>
  );
}

interface IActionBtnsProps {
  icon: React.ReactNode;
  txt: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}

function ActionBtn({ icon, onPress, txt, color, disabled }: IActionBtnsProps) {
  return (
    <View style={styles.btnWrap}>
      <IconBtn
        icon={icon}
        size={s(60)}
        outlined
        onPress={onPress}
        disabled={disabled}
        testId={`${txt}-btn`}
      />
      <Txt
        txt={txt}
        bold
        styles={[styles.btnTxt, { color, opacity: disabled ? 0.5 : 1 }]}
      />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  balanceSection: {
    flex: 2,
  },
  actionsSection: {
    flex: 1,
    justifyContent: "flex-start",
  },
  actionWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "-40@s", // Offset to float centered at intersection
  },
  btnWrap: {
    alignItems: "center",
    minWidth: "100@s",
  },
  btnTxt: {
    marginTop: "10@s",
  },
  hintWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "50@s",
  },
  betaHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
    paddingVertical: "10@s",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: mainColors.WARN,
    borderRadius: "50@s",
    minWidth: "120@s",
  },
});
