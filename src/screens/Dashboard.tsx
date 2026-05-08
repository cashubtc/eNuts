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
import {
  AppText,
  appLineHeight,
  appFontSize,
  globals,
  PressableSurface,
  useAppThemeTokens,
  Stack,
} from "@styles";
import { getStrFromClipboard } from "@util";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LatestHistoryMeltEntry } from "./History/components/LatestHistoryMeltEntry";
import { LatestHistoryMintEntry } from "./History/components/LatestHistoryMintEntry";
import { LatestHistoryReceiveEntry } from "./History/components/LatestHistoryReceiveEntry";
import { LatestHistorySendEntry } from "./History/components/LatestHistorySendEntry";
import DashboardActionSheet, { DashboardActionSheetOption } from "./DashboardActionSheet";
export default function Dashboard({ navigation }: TDashboardPageProps) {
  const { t } = useTranslation([NS.common, NS.wallet]);
  const { activeTheme } = useThemeContext();
  const theme = useAppThemeTokens();
  const accentColor = theme.accent;
  const isDarkTheme = activeTheme === "dark";
  const balanceTextColor = accentColor;
  const balanceMetaColor = theme.textSecondary;
  const actionTextColor = theme.text;
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
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <Stack style={styles.container}>
        <DashboardTopBar
          onSettingsPress={() => navigation.navigate("Settings", { screen: "SettingsMain" })}
        />
        <Stack style={styles.content}>
          <Stack style={styles.balanceSection}>
            <PressableSurface
              style={styles.balanceWrap}
              onPress={toggleBalanceFormat}
              disabled={hidden.balance}
              accessibilityRole="button"
            >
              <AppText
                testID={`balance: ${balances.total.total}`}
                style={[styles.balanceAmount, { color: balanceTextColor }]}
              >
                {hidden.balance ? "****" : balanceAmount.formatted}
              </AppText>
              <Stack style={styles.balanceMetaWrap}>
                {!hidden.balance && (
                  <>
                    <AppText style={[styles.balanceSymbol, { color: balanceMetaColor }]}>
                      {balanceAmount.symbol}
                    </AppText>
                    <SwapCurrencyIcon width={18} height={18} color={balanceMetaColor} />
                  </>
                )}
              </Stack>
              <Stack
                style={[
                  styles.balanceRule,
                  { backgroundColor: withAlpha(accentColor, isDarkTheme ? 0.4 : 0.28) },
                ]}
              />
            </PressableSurface>
          </Stack>

          <Stack style={styles.historySection}>
            <Stack style={styles.sectionHeader}>
              <AppText style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={1}>
                {t("activity")}
              </AppText>
              {hasMore && (
                <PressableSurface
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
                  <AppText
                    numberOfLines={1}
                    style={[styles.historyLinkTxt, { color: accentColor }]}
                  >
                    {t("allHistory")}
                  </AppText>
                </PressableSurface>
              )}
            </Stack>
            {!latestHistory.length ? (
              <Stack style={[styles.emptyHistory, { backgroundColor: theme.drawer }]}>
                <AppText
                  style={[globals().txt, { color: theme.text }, styles.emptyHistoryTxt]}
                  testID={`${t("noTX")}-txt`}
                >
                  {t("noTX")}
                </AppText>
              </Stack>
            ) : (
              <ScrollView
                style={[styles.historyList, { backgroundColor: theme.drawer }]}
                contentContainerStyle={styles.historyListContent}
                showsVerticalScrollIndicator={false}
              >
                {latestHistory.slice(0, 10).map((entry, index) => (
                  <Stack key={entry.id} style={styles.historyEntry}>
                    {renderHistoryEntry(entry)}
                    {index < latestHistory.length - 1 && index < 9 ? (
                      <Stack
                        style={[styles.historyDivider, { backgroundColor: theme.darkBorder }]}
                      />
                    ) : null}
                  </Stack>
                ))}
              </ScrollView>
            )}
          </Stack>
        </Stack>

        <Stack style={styles.actionDockWrap}>
          <Stack
            style={[
              styles.actionDock,
              {
                backgroundColor: theme.drawer,
                borderColor: isDarkTheme ? theme.darkBorder : theme.border,
              },
            ]}
          >
            {knownMints.length > 0 ? (
              <ActionBtn
                icon={<SendIcon width={26} height={26} color={actionIconColor} />}
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
                icon={<PlusIcon width={28} height={28} color={actionIconColor} />}
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
              icon={<ScanQRIcon width={26} height={26} color={actionIconColor} />}
              txt={t("scan")}
              textColor={actionTextColor}
              iconBackgroundColor={actionIconBackground}
              iconBorderColor={actionIconBorderColor}
              onPress={() => navigation.navigate("QRScanner")}
            />
            <ActionBtn
              icon={<ReceiveIcon width={26} height={26} color={actionIconColor} />}
              txt={t("receive", { ns: NS.wallet })}
              textColor={actionTextColor}
              iconBackgroundColor={actionIconBackground}
              iconBorderColor={actionIconBorderColor}
              disabled={isReceiving}
              onPress={() => {
                void receiveOptionsRef.current?.present();
              }}
            />
          </Stack>
        </Stack>

        <DashboardActionSheet
          sheetRef={sendOptionsRef}
          title={t("send", { ns: NS.wallet })}
          closeAccessibilityLabel={t("cancel")}
          backgroundColor={theme.background}
          closeIconColor={theme.textSecondary}
        >
          <DashboardActionSheetOption
            icon={<SendMsgIcon width={16} height={16} color={theme.valid} />}
            title={t("sendEcash")}
            description={t("sendEcashDashboard")}
            textColor={theme.text}
            descriptionColor={theme.textSecondary}
            onPress={() => {
              void sendOptionsRef.current?.dismiss();
              navigation.navigate("SendSelectAmount");
            }}
            testID="send-ecash-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<ZapIcon width={26} height={26} color={theme.zap} />}
            title={t("payLNInvoice", { ns: NS.wallet })}
            description={t("payInvoiceDashboard")}
            textColor={theme.text}
            descriptionColor={theme.textSecondary}
            onPress={() => {
              void sendOptionsRef.current?.dismiss();
              navigation.navigate("MeltInput", {});
            }}
            testID="pay-invoice-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<NfcIcon width={20} color={theme.valid} />}
            title={t("nfcPayment", {
              ns: NS.wallet,
              defaultValue: "NFC Payment",
            })}
            description={t("nfcPaymentDescription", {
              ns: NS.wallet,
              defaultValue: "Tap to pay at a terminal",
            })}
            textColor={theme.text}
            descriptionColor={theme.textSecondary}
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
          backgroundColor={theme.background}
          closeIconColor={theme.textSecondary}
        >
          <DashboardActionSheetOption
            icon={
              loading ? (
                <Loading size="small" color={theme.valid} />
              ) : (
                <CopyIcon color={theme.valid} />
              )
            }
            title={loading ? t("claiming", { ns: NS.wallet }) : t("pasteToken", { ns: NS.wallet })}
            description={t("receiveEcashDashboard")}
            textColor={theme.text}
            descriptionColor={theme.textSecondary}
            onPress={() => {
              void handleClaimBtnPress();
              void receiveOptionsRef.current?.dismiss();
            }}
            testID="send-ecash-option"
          />

          <Separator style={styles.sheetSeparator} />

          <DashboardActionSheetOption
            icon={<ZapIcon width={26} height={26} color={theme.zap} />}
            title={t("createLnInvoice")}
            description={t("createInvoiceDashboard")}
            textColor={theme.text}
            descriptionColor={theme.textSecondary}
            onPress={() => {
              void receiveOptionsRef.current?.dismiss();
              navigation.navigate("MintSelectAmount");
            }}
            testID="pay-invoice-option"
          />
        </DashboardActionSheet>
      </Stack>
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
    <PressableSurface
      accessibilityRole="button"
      activeOpacity={0.65}
      style={[styles.actionBtn, { opacity: disabled ? 0.45 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      testID={`${txt}-btn`}
    >
      <Stack
        style={[
          styles.actionIcon,
          { backgroundColor: iconBackgroundColor, borderColor: iconBorderColor },
        ]}
      >
        {icon}
      </Stack>
      <AppText weight="medium" size="caption" align="center" testID={`${txt}-txt`}>
        {txt}
      </AppText>
    </PressableSurface>
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
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  balanceSection: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  balanceWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  balanceAmount: {
    fontSize: appFontSize.heroAmount,
    fontWeight: "700",
    lineHeight: appLineHeight.heroAmount,
    textAlign: "center",
  },
  balanceMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 22,
    marginTop: -2,
  },
  balanceSymbol: {
    fontSize: appFontSize.body,
    fontWeight: "500",
    marginRight: 6,
  },
  balanceRule: {
    width: 72,
    height: 3,
    borderRadius: 2,
    marginTop: 12,
  },
  actionDockWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  actionDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 82,
    minHeight: 70,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  sheetSeparator: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  historySection: {
    flex: 1,
  },
  sectionHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: appFontSize.modalTitle,
    fontWeight: "600",
    marginRight: 14,
  },
  historyLink: {
    minWidth: 52,
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLinkTxt: {
    fontSize: appFontSize.bodySmall,
    fontWeight: "500",
    textAlign: "right",
  },
  historyList: {
    flex: 1,
    borderRadius: 26,
    paddingHorizontal: 16,
  },
  historyListContent: {
    paddingTop: 12,
    paddingBottom: 2,
  },
  historyEntry: {
    paddingTop: 1,
  },
  historyDivider: {
    height: 1,
    marginTop: 9,
    marginBottom: 9,
  },
  emptyHistory: {
    minHeight: 100,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyHistoryTxt: {
    textAlign: "center",
  },
});
