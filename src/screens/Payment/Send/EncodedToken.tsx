import { getEncodedToken } from "@cashu/cashu-ts";
import Button from "@comps/Button";
import { ShareIcon } from "@comps/Icons";
import QR from "@comps/QR";
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { preventBack } from "@nav/utils";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { AppText, fontScale, globals, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl, formatSatStr, share } from "@util";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useManager } from "@src/context/Manager";

const QR_HORIZONTAL_CHROME = 20;
const QR_VERTICAL_CHROME = 82;
const MIN_QR_SIZE = 140;
/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
  const { token } = route.params || {};
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { width, height } = useWindowDimensions();
  const [qrStageSize, setQrStageSize] = useState({ width: 0, height: 0 });
  const { formatBalance, formatAmount } = useCurrencyContext();
  const [error, setError] = useState({ msg: "", open: false });
  const encodedToken = useMemo(() => getEncodedToken(token), [token]);
  const tokenAmount = useMemo(() => token.proofs.reduce((r, c) => r + c.amount, 0), [token]);
  const qrSize = useMemo(() => {
    if (!qrStageSize.width || !qrStageSize.height) {
      return Math.round(Math.max(196, Math.min(288, width - 96, height * 0.32)));
    }

    return Math.max(
      MIN_QR_SIZE,
      Math.floor(
        Math.min(qrStageSize.width - QR_HORIZONTAL_CHROME, qrStageSize.height - QR_VERTICAL_CHROME),
      ),
    );
  }, [height, qrStageSize.height, qrStageSize.width, width]);
  const manager = useManager();
  // For tokens, always show sats as primary (tokens ARE in sats)
  // Show fiat equivalent as secondary info if user prefers fiat
  const fiatEquivalent = formatBalance ? formatAmount(tokenAmount) : null;
  const amountLabel = formatSatStr(tokenAmount, "standard", true);
  const mintLabel = formatMintUrl(token.mint);
  const qrStageHeight = useMemo(
    () => Math.round(Math.max(300, Math.min(height * 0.5, width + QR_VERTICAL_CHROME - 20))),
    [height, width],
  );
  //TODO: Add spent check
  const spent = false;

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);
  useEffect(() => {
    const unsub = manager.on("send:finalized", () => {
      navigation.navigate("dashboard");
    });
    return () => unsub();
  }, []);
  return (
    <Screen
      withBackBtn={!spent}
      screenName={!spent ? t("newToken") : undefined}
      handlePress={() => navigation.navigate("dashboard")}
      withPadding={false}
      rightAction={
        !spent ? (
          <PressableSurface
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={() => void share(encodedToken, `cashu://${encodedToken}`)}
            style={styles.headerShareButton}
            testID={`${t("share")}-header-button`}
          >
            <ShareIcon width={20} height={20} color={theme.accent} />
          </PressableSurface>
        ) : undefined
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {spent ? (
          <Stack style={styles.spentContent}>
            <Stack />
            <Stack>
              <AppText style={[styles.successTxt, { color: theme.text }]}>
                {t("isSpent", { ns: NS.history })}
              </AppText>
              <Stack style={styles.successAnim}>
                <LottieView
                  source={require("../../../../assets/lottie/success.json")}
                  autoPlay
                  loop={false}
                  style={styles.lottie}
                  renderMode="HARDWARE"
                />
              </Stack>
            </Stack>
            <Button txt={t("backToDashboard")} onPress={() => navigation.navigate("dashboard")} />
          </Stack>
        ) : (
          <Stack style={styles.tokenContent}>
            <Stack
              style={[styles.qrStage, { minHeight: qrStageHeight }]}
              onLayout={(event) => setQrStageSize(event.nativeEvent.layout)}
            >
              {error.open ? (
                <Stack style={[styles.errorPanel, { backgroundColor: theme.inputBackground }]}>
                  <AppText
                    style={[styles.errorMsg, { color: theme.text }]}
                    align="center"
                    testID={`${error.msg}-txt`}
                  >
                    {error.msg}
                  </AppText>
                </Stack>
              ) : (
                <QR
                  size={qrSize}
                  value={encodedToken}
                  animate
                  truncateNum={14}
                  onError={() =>
                    setTimeout(
                      () =>
                        setError({
                          msg: t("bigQrMsg"),
                          open: true,
                        }),
                      0,
                    )
                  }
                />
              )}
            </Stack>

            <Stack
              style={[
                globals().wrapContainer,
                styles.metadataCard,
                { backgroundColor: theme.drawer },
              ]}
            >
              <MetadataRow label={t("amount")} value={amountLabel} />
              {fiatEquivalent && (
                <MetadataRow
                  label={t("currencyConversion")}
                  value={`≈ ${fiatEquivalent.symbol}${fiatEquivalent.formatted}`}
                />
              )}
              <MetadataRow label={t("mint")} value={mintLabel} isLast />
            </Stack>
          </Stack>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetadataRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const theme = useAppThemeTokens();

  return (
    <Stack
      style={[
        styles.metadataRow,
        !isLast && {
          borderBottomColor: theme.darkBorder,
          borderBottomWidth: 1,
        },
      ]}
    >
      <AppText
        style={[styles.metadataLabel, { color: theme.textSecondary }]}
        weight="medium"
        testID={`${label}-txt`}
      >
        {label}
      </AppText>
      <AppText
        style={[styles.metadataValue, { color: theme.textSecondary }]}
        testID={`${value}-txt`}
      >
        {value}
      </AppText>
    </Stack>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  spentContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 20,
  },
  tokenContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    gap: 14,
  },
  metadataCard: {
    width: "100%",
  },
  metadataRow: {
    minHeight: 50,
    paddingBottom: 12,
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: fontScale(12),
    marginBottom: 3,
  },
  metadataValue: {
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
  },
  qrStage: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    width: "100%",
  },
  errorPanel: {
    alignItems: "center",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 220,
    padding: 22,
    width: "100%",
  },
  errorMsg: {
    fontSize: fontScale(16),
    lineHeight: fontScale(23),
    textAlign: "center",
  },
  successTxt: {
    fontSize: fontScale(28),
    fontWeight: "800",
    textAlign: "center",
    marginTop: 30,
  },
  successAnim: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  headerShareButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
