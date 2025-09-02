import { getDecodedToken, getEncodedToken, Token } from "@cashu/cashu-ts";
import Balance from "@comps/Balance";
import { IconBtn } from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import { PlusIcon, ReceiveIcon, ScanQRIcon, SendIcon } from "@comps/Icons";
import BottomSheetOptionsModal from "@comps/modal/BottomSheetOptionsModal";
import Txt from "@comps/Txt";
import BottomSheet from "@gorhom/bottom-sheet";
import { _testmintUrl, env } from "@consts";
import type { TBeforeRemoveEvent, TDashboardPageProps } from "@model/nav";
import BottomNav from "@nav/BottomNav";
import { preventBack } from "@nav/utils";
import { useFocusClaimContext } from "@src/context/FocusClaim";
import { useHistoryContext } from "@src/context/History";
import { useInitialURL } from "@src/context/Linking";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { useTrustMintContext } from "@src/context/TrustMint";
import { useKnownMints } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
// import { useQRScanHandler } from "@util/qrScanner"; // No longer needed - using dedicated screen
import { mintService } from "@src/services/MintService";
import { highlight as hi, mainColors } from "@styles";
import { getStrFromClipboard } from "@util";
import { getMintsForPayment } from "@wallet";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useManager } from "@src/context/Manager";

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
  const { t } = useTranslation([NS.common]);
  // Theme
  const { color, highlight } = useThemeContext();
  // Loading state
  const { loading, startLoading, stopLoading } = useLoading();
  // Prompt modal
  const { openPromptAutoClose } = usePromptContext();
  // Trust mint modal
  const { showTrustMintModal } = useTrustMintContext();
  const { knownMints } = useKnownMints();
  const manager = useManager();
  // QR Scanner - using dedicated screen instead of bottom sheet
  // const { openQRScanner } = useQRScanHandler(navigation);
  // Bottom sheet refs
  const sendOptionsRef = useRef<BottomSheet>(null);
  const receiveOptionsRef = useRef<BottomSheet>(null);

  const handleClaimBtnPress = async () => {
    if (loading) {
      return;
    }
    startLoading();
    const clipboard = await getStrFromClipboard();
    let decoded: Token;
    try {
      if (!clipboard) {
        throw new Error("Clipboard is empty");
      }
      decoded = getDecodedToken(clipboard);
      if (!decoded) {
        throw new Error("Clipboard is not a valid cashu token");
      }
    } catch {
      openPromptAutoClose({ msg: t("clipboardInvalid") });
      stopLoading();
      return;
    }

    if (!knownMints.find((m) => m.mintUrl === decoded.mint)) {
      const action = await showTrustMintModal(decoded);

      if (action === "trust") {
        await manager.mint.addMint(decoded.mint);
        console.log("mint added");
        try {
          await manager.wallet.receive(decoded);
          console.log("mint received");
        } catch (e) {
          console.log("error receiving mint", e);
        }
      } else {
        return;
      }
      stopLoading();
    }
    try {
      await manager.wallet.receive(decoded);
      console.log("mint received");
    } catch (e) {
      console.log("error receiving mint", e);
    }
  };

  const handleMintBtnPress = async () => {
    const { mintsBals, mints } = await getMintsForPayment();
    const nonEmptyMints = mintsBals.filter((m) => m.amount > 0);
    // user has only 1 mint with balance, he can skip the mint selection
    if (nonEmptyMints.length === 1) {
      return navigation.navigate("selectAmount", {
        // No mint parameter needed, SelectAmount will get mint from context
      });
    }
    // user has more than 1 mint so he has to choose the one he wants to communicate to
    navigation.navigate("selectMint", {
      mints,
      mintsWithBal: mintsBals,
      allMintsEmpty: !nonEmptyMints.length,
    });
  };

  const handleSendBtnPress = async ({
    isMelt,
    isSendEcash,
  }: {
    isMelt?: boolean;
    isSendEash?: boolean;
  } = {}) => {
    if (isMelt) {
      navigation.navigate("meltInputfield");
    } else {
      // Navigate directly to selectAmount with the correct parameters
      navigation.navigate("selectAmount", {
        isMelt,
        isSendEcash,
      });
    }
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
      {/* Balance, Disclaimer & History */}
      <Balance nav={navigation} />
      {/* Receive/send/mints buttons */}
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
              navigation.navigate("mints");
            }}
          />
        )}
        <ActionBtn
          icon={
            <ScanQRIcon width={s(32)} height={s(32)} color={hi[highlight]} />
          }
          txt={t("scan")}
          color={hi[highlight]}
          onPress={() => navigation.navigate("qr scan", {})}
        />
        <ActionBtn
          icon={
            <ReceiveIcon width={s(32)} height={s(32)} color={hi[highlight]} />
          }
          txt={t("receive", { ns: NS.wallet })}
          color={hi[highlight]}
          onPress={() => {
            // if (!hasMint) {
            //     // try to claim from clipboard to avoid receive-options-modal to popup and having to press again
            //     return handleClaimBtnPress();
            // }
            receiveOptionsRef.current?.snapToIndex(0);
          }}
        />
      </View>
      {/* beta warning */}
      {(env.isExpoBeta || __DEV__) && (
        <View style={styles.hintWrap}>
          <TouchableOpacity
            onPress={() => navigation.navigate("disclaimer")}
            style={styles.betaHint}
          >
            <Txt txt="BETA" styles={[{ color: mainColors.WARN }]} />
          </TouchableOpacity>
        </View>
      )}
      {/* Bottom nav icons */}
      <BottomNav navigation={navigation} route={route} />
      {/* Send options bottom sheet */}
      <BottomSheetOptionsModal
        ref={sendOptionsRef}
        button1Txt={t("sendEcash")}
        onPressFirstBtn={() => void handleSendBtnPress({ isSendEcash: true })}
        button2Txt={t("payLNInvoice", { ns: NS.wallet })}
        onPressSecondBtn={() => void handleSendBtnPress({ isMelt: true })}
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
        onPressSecondBtn={() => void handleMintBtnPress()}
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
  actionWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "-30@s",
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
