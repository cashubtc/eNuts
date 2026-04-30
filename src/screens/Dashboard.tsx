import DashboardTopBar from "@comps/DashboardTopBar";
import useLoading from "@comps/hooks/Loading";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";
import {
  NfcIcon,
  PlusIcon,
  ReceiveIcon,
  ScanQRIcon,
  SendIcon,
  SwapCurrencyIcon,
} from "@comps/Icons";
import BottomSheetOptionsModal from "@comps/modal/BottomSheetOptionsModal";
import NfcPaymentModal, { type NfcPaymentModalRef } from "@comps/modal/NfcPaymentModal";
import Txt from "@comps/Txt";
import type { HistoryEntry } from "@cashu/coco-core";
import { usePaginatedHistory } from "@cashu/coco-react";
import BottomSheet from "@gorhom/bottom-sheet";
import type { TBeforeRemoveEvent, TDashboardPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useBalanceContext } from "@src/context/Balance";
import { useCurrencyContext } from "@src/context/Currency";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { getStrFromClipboard } from "@util";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { s, ScaledSheet } from "react-native-size-matters";

import { LatestHistoryMeltEntry } from "./History/components/LatestHistoryMeltEntry";
import { LatestHistoryMintEntry } from "./History/components/LatestHistoryMintEntry";
import { LatestHistoryReceiveEntry } from "./History/components/LatestHistoryReceiveEntry";
import { LatestHistorySendEntry } from "./History/components/LatestHistorySendEntry";

export default function Dashboard({ navigation }: TDashboardPageProps) {
  const { t } = useTranslation([NS.common, NS.wallet]);
  const { activeTheme, color, highlight } = useThemeContext();
  const accentColor = hi[highlight];
  const isDarkTheme = activeTheme === "dark";
  const balanceTextColor = accentColor;
  const balanceMetaColor = color.TEXT_SECONDARY;
  const actionTextColor = color.TEXT;
  const actionIconColor = accentColor;
  const actionIconBackground = withAlpha(accentColor, isDarkTheme ? 0.14 : 0.12);
  const actionIconBorderColor = withAlpha(accentColor, isDarkTheme ? 0.24 : 0.18);
  const { loading, startLoading, stopLoading } = useLoading();
  const { openPromptAutoClose } = usePromptContext();
  const { knownMints } = useKnownMints();
  const { hidden } = usePrivacyContext();
  const { balances } = useBalanceContext();
  const { formatAmount, formatBalance, setFormatBalance } = useCurrencyContext();
  const { history: latestHistory, hasMore } = usePaginatedHistory(10);
  const sendOptionsRef = useRef<BottomSheet>(null);
  const receiveOptionsRef = useRef<BottomSheet>(null);
  const nfcModalRef = useRef<NfcPaymentModalRef>(null);
  const { claimFromTokenString, isReceiving } = useCashuClaimFlow();
  const balanceAmount = formatAmount(balances.total.total);

  const toggleBalanceFormat = () => {
    void setFormatBalance(!formatBalance);
  };

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

  const handleNfcOptionPress = () => {
    sendOptionsRef.current?.close();
    setTimeout(() => {
      nfcModalRef.current?.open();
    }, 200);
  };

  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: color.BACKGROUND }]}
      edges={["bottom"]}
    >
      <View style={styles.container}>
        <DashboardTopBar
          onSettingsPress={() => navigation.navigate("Settings", { screen: "SettingsMain" })}
        />
        <View style={styles.content}>
          <View style={styles.balanceSection}>
            <TouchableOpacity
              style={styles.balanceWrap}
              onPress={toggleBalanceFormat}
              disabled={hidden.balance}
              accessibilityRole="button"
            >
              <Text
                testID={`balance: ${balances.total.total}`}
                style={[styles.balanceAmount, { color: balanceTextColor }]}
              >
                {hidden.balance ? "****" : balanceAmount.formatted}
              </Text>
              <View style={styles.balanceMetaWrap}>
                {!hidden.balance && (
                  <>
                    <Text style={[styles.balanceSymbol, { color: balanceMetaColor }]}>
                      {balanceAmount.symbol}
                    </Text>
                    <SwapCurrencyIcon width={s(18)} height={s(18)} color={balanceMetaColor} />
                  </>
                )}
              </View>
              <View
                style={[
                  styles.balanceRule,
                  { backgroundColor: withAlpha(accentColor, isDarkTheme ? 0.4 : 0.28) },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: color.TEXT }]} numberOfLines={1}>
                {t("activity")}
              </Text>
              {hasMore && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("History", { screen: "HistoryMain" })}
                  style={[
                    styles.historyLink,
                    {
                      backgroundColor: withAlpha(accentColor, isDarkTheme ? 0.14 : 0.12),
                      borderColor: withAlpha(accentColor, isDarkTheme ? 0.28 : 0.18),
                    },
                  ]}
                  testID={`${t("allHistory")}-button`}
                >
                  <Text numberOfLines={1} style={[styles.historyLinkTxt, { color: accentColor }]}>
                    {t("allHistory")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {!latestHistory.length ? (
              <View style={[styles.emptyHistory, { backgroundColor: color.DRAWER }]}>
                <Txt txt={t("noTX")} styles={[globals(color).txt, styles.emptyHistoryTxt]} />
              </View>
            ) : (
              <ScrollView
                style={[styles.historyList, { backgroundColor: color.DRAWER }]}
                contentContainerStyle={styles.historyListContent}
                showsVerticalScrollIndicator={false}
              >
                {latestHistory.slice(0, 10).map((entry, index) => (
                  <View key={entry.id} style={styles.historyEntry}>
                    {renderHistoryEntry(entry)}
                    {index < latestHistory.length - 1 && index < 9 ? (
                      <View
                        style={[styles.historyDivider, { backgroundColor: color.DARK_BORDER }]}
                      />
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View style={styles.actionDockWrap}>
          <View
            style={[
              styles.actionDock,
              {
                backgroundColor: color.DRAWER,
                borderColor: isDarkTheme ? color.DARK_BORDER : color.BORDER,
              },
            ]}
          >
            {knownMints.length > 0 ? (
              <ActionBtn
                icon={<SendIcon width={s(26)} height={s(26)} color={actionIconColor} />}
                txt={t("send", { ns: NS.wallet })}
                textColor={actionTextColor}
                iconBackgroundColor={actionIconBackground}
                iconBorderColor={actionIconBorderColor}
                onPress={() => {
                  sendOptionsRef.current?.snapToIndex(0);
                }}
              />
            ) : (
              <ActionBtn
                icon={<PlusIcon width={s(28)} height={s(28)} color={actionIconColor} />}
                txt={t("mint")}
                textColor={actionTextColor}
                iconBackgroundColor={actionIconBackground}
                iconBorderColor={actionIconBorderColor}
                onPress={() => {
                  navigation.navigate("Mint", { screen: "MintHome" });
                }}
              />
            )}
            <ActionBtn
              icon={<ScanQRIcon width={s(26)} height={s(26)} color={actionIconColor} />}
              txt={t("scan")}
              textColor={actionTextColor}
              iconBackgroundColor={actionIconBackground}
              iconBorderColor={actionIconBorderColor}
              onPress={() => navigation.navigate("QRScanner")}
            />
            <ActionBtn
              icon={<ReceiveIcon width={s(26)} height={s(26)} color={actionIconColor} />}
              txt={t("receive", { ns: NS.wallet })}
              textColor={actionTextColor}
              iconBackgroundColor={actionIconBackground}
              iconBorderColor={actionIconBorderColor}
              disabled={isReceiving}
              onPress={() => {
                receiveOptionsRef.current?.snapToIndex(0);
              }}
            />
          </View>
        </View>

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
          button3Txt={t("nfcPayment", {
            ns: NS.wallet,
            defaultValue: "NFC Payment",
          })}
          button3Description={t("nfcPaymentDescription", {
            ns: NS.wallet,
            defaultValue: "Tap to pay at a terminal",
          })}
          button3Icon={<NfcIcon width={s(20)} color={mainColors.VALID} />}
          onPressThirdBtn={handleNfcOptionPress}
          onPressCancel={() => {}}
          isSend
        />

        <NfcPaymentModal
          ref={nfcModalRef}
          onSuccess={(result) => {
            openPromptAutoClose({
              msg: result.amount
                ? `Sent ${result.amount.toLocaleString()} sats via NFC!`
                : "NFC payment sent successfully!",
              success: true,
            });
          }}
          onError={(result) => {
            openPromptAutoClose({
              msg: result.error || "NFC payment failed",
              success: false,
            });
          }}
          onPaymentHandoff={(handoff) => {
            navigation.navigate("MeltInput", { invoice: handoff.value });
          }}
        />

        <BottomSheetOptionsModal
          ref={receiveOptionsRef}
          button1Txt={
            loading ? t("claiming", { ns: NS.wallet }) : t("pasteToken", { ns: NS.wallet })
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
    </SafeAreaView>
  );
}

interface IActionBtnsProps {
  icon: ReactNode;
  txt: string;
  onPress: () => void;
  textColor: string;
  iconBackgroundColor: string;
  iconBorderColor: string;
  disabled?: boolean;
}

function ActionBtn({
  icon,
  onPress,
  txt,
  textColor,
  iconBackgroundColor,
  iconBorderColor,
  disabled,
}: IActionBtnsProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.65}
      style={[styles.actionBtn, { opacity: disabled ? 0.45 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      testID={`${txt}-btn`}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: iconBackgroundColor, borderColor: iconBorderColor },
        ]}
      >
        {icon}
      </View>
      <Txt txt={txt} bold styles={[styles.actionTxt, { color: textColor }]} />
    </TouchableOpacity>
  );
}

function renderHistoryEntry(entry: HistoryEntry) {
  switch (entry.type) {
    case "mint":
      return <LatestHistoryMintEntry history={entry} variant="standard" />;
    case "send":
      return <LatestHistorySendEntry history={entry} variant="standard" />;
    case "melt":
      return <LatestHistoryMeltEntry history={entry} variant="standard" />;
    case "receive":
      return <LatestHistoryReceiveEntry history={entry} variant="standard" />;
    default:
      return null;
  }
}

function withAlpha(hex: string, alpha: number) {
  const color = hex.replace("#", "");
  if (color.length !== 6) {
    return hex;
  }

  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: "20@s",
    paddingTop: "2@vs",
  },
  balanceSection: {
    paddingTop: "10@vs",
    paddingBottom: "24@vs",
  },
  balanceWrap: {
    alignItems: "center",
    paddingVertical: "8@vs",
  },
  balanceAmount: {
    fontSize: "64@s",
    fontWeight: "700",
    lineHeight: "74@s",
    textAlign: "center",
  },
  balanceMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: "22@s",
    marginTop: "-2@vs",
  },
  balanceSymbol: {
    fontSize: "14@vs",
    fontWeight: "500",
    marginRight: "6@s",
  },
  balanceRule: {
    width: "72@s",
    height: "3@vs",
    borderRadius: "2@vs",
    marginTop: "12@vs",
  },
  actionDockWrap: {
    paddingHorizontal: "20@s",
    paddingTop: "8@vs",
    paddingBottom: "10@vs",
    backgroundColor: "transparent",
  },
  actionDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "26@s",
    borderWidth: 1,
    paddingHorizontal: "14@s",
    paddingVertical: "10@vs",
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "82@s",
    minHeight: "70@s",
  },
  actionIcon: {
    width: "44@s",
    height: "44@s",
    borderRadius: "22@s",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "7@vs",
  },
  actionTxt: {
    fontSize: "12@vs",
    textAlign: "center",
  },
  historySection: {
    flex: 1,
  },
  sectionHeader: {
    minHeight: "34@vs",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10@vs",
  },
  sectionTitle: {
    flex: 1,
    fontSize: "22@vs",
    fontWeight: "600",
    marginRight: "14@s",
  },
  historyLink: {
    minWidth: "52@s",
    minHeight: "30@vs",
    borderRadius: "15@vs",
    borderWidth: 1,
    paddingHorizontal: "14@s",
    alignItems: "center",
    justifyContent: "center",
  },
  historyLinkTxt: {
    fontSize: "13@vs",
    fontWeight: "500",
    textAlign: "right",
  },
  historyList: {
    flex: 1,
    borderRadius: "26@s",
    paddingHorizontal: "16@s",
  },
  historyListContent: {
    paddingTop: "12@vs",
    paddingBottom: "2@vs",
  },
  historyEntry: {
    paddingTop: "1@vs",
  },
  historyDivider: {
    height: 1,
    marginTop: "9@vs",
    marginBottom: "9@vs",
  },
  emptyHistory: {
    minHeight: "100@vs",
    borderRadius: "26@s",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
  },
  emptyHistoryTxt: {
    textAlign: "center",
  },
});
