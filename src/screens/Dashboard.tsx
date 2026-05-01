import DashboardTopBar from "@comps/DashboardTopBar";
import useLoading from "@comps/hooks/Loading";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";
import {
  CopyIcon,
  NfcIcon,
  PlusIcon,
  ReceiveIcon,
  ScanQRIcon,
  SendIcon,
  SendMsgIcon,
  SwapCurrencyIcon,
  ZapIcon,
} from "@comps/Icons";
import Loading from "@comps/Loading";
import NfcPaymentModal, { type NfcPaymentModalRef } from "@comps/modal/NfcPaymentModal";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { HistoryEntry } from "@cashu/coco-core";
import { usePaginatedHistory } from "@cashu/coco-react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
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
import DashboardActionSheet, { DashboardActionSheetOption } from "./DashboardActionSheet";

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
  const sendOptionsRef = useRef<TrueSheet>(null);
  const receiveOptionsRef = useRef<TrueSheet>(null);
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
    void sendOptionsRef.current?.dismiss();
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
                  void sendOptionsRef.current?.present();
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
                void receiveOptionsRef.current?.present();
              }}
            />
          </View>
        </View>

        <DashboardActionSheet
          sheetRef={sendOptionsRef}
          title={t("send", { ns: NS.wallet })}
          closeAccessibilityLabel={t("cancel")}
          backgroundColor={color.BACKGROUND}
          closeIconColor={color.TEXT_SECONDARY}
        >
          <DashboardActionSheetOption
            icon={<SendMsgIcon width={s(16)} height={s(16)} color={mainColors.VALID} />}
            title={t("sendEcash")}
            description={t("sendEcashDashboard")}
            textColor={color.TEXT}
            descriptionColor={color.TEXT_SECONDARY}
            onPress={() => {
              void sendOptionsRef.current?.dismiss();
              navigation.navigate("SendSelectAmount");
            }}
            testID="send-ecash-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<ZapIcon width={s(26)} height={s(26)} color={mainColors.ZAP} />}
            title={t("payLNInvoice", { ns: NS.wallet })}
            description={t("payInvoiceDashboard")}
            textColor={color.TEXT}
            descriptionColor={color.TEXT_SECONDARY}
            onPress={() => {
              void sendOptionsRef.current?.dismiss();
              navigation.navigate("MeltInput", {});
            }}
            testID="pay-invoice-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<NfcIcon width={s(20)} color={mainColors.VALID} />}
            title={t("nfcPayment", {
              ns: NS.wallet,
              defaultValue: "NFC Payment",
            })}
            description={t("nfcPaymentDescription", {
              ns: NS.wallet,
              defaultValue: "Tap to pay at a terminal",
            })}
            textColor={color.TEXT}
            descriptionColor={color.TEXT_SECONDARY}
            onPress={handleNfcOptionPress}
            testID="third-option"
          />
        </DashboardActionSheet>

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

        <DashboardActionSheet
          sheetRef={receiveOptionsRef}
          title={t("receive", { ns: NS.wallet })}
          closeAccessibilityLabel={t("cancel")}
          backgroundColor={color.BACKGROUND}
          closeIconColor={color.TEXT_SECONDARY}
        >
          <DashboardActionSheetOption
            icon={
              loading ? (
                <Loading size="small" color={mainColors.VALID} />
              ) : (
                <CopyIcon color={mainColors.VALID} />
              )
            }
            title={loading ? t("claiming", { ns: NS.wallet }) : t("pasteToken", { ns: NS.wallet })}
            description={t("receiveEcashDashboard")}
            textColor={color.TEXT}
            descriptionColor={color.TEXT_SECONDARY}
            onPress={() => {
              void handleClaimBtnPress();
              void receiveOptionsRef.current?.dismiss();
            }}
            testID="send-ecash-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<ZapIcon width={s(26)} height={s(26)} color={mainColors.ZAP} />}
            title={t("createLnInvoice")}
            description={t("createInvoiceDashboard")}
            textColor={color.TEXT}
            descriptionColor={color.TEXT_SECONDARY}
            onPress={() => {
              void receiveOptionsRef.current?.dismiss();
              navigation.navigate("MintSelectAmount");
            }}
            testID="pay-invoice-option"
          />
        </DashboardActionSheet>
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
    paddingHorizontal: "8@s",
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
    paddingHorizontal: "8@s",
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
  sheetSeparator: {
    width: "100%",
    marginTop: "10@vs",
    marginBottom: "10@vs",
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
