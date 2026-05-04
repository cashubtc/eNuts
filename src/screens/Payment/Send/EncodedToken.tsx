import { getEncodedToken } from "@cashu/cashu-ts";
import Button from "@comps/Button";
import useCopy from "@comps/hooks/Copy";
import { CopyIcon, ShareIcon } from "@comps/Icons";
import QR from "@comps/QR";
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { preventBack } from "@nav/utils";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { AppText, fontScale, useAppThemeTokens, Stack } from "@styles";
import { formatInt, formatSatStr, share } from "@util";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useManager } from "@src/context/Manager";
/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
  const { token } = route.params || {};
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { width, height } = useWindowDimensions();
  const { formatBalance, formatAmount } = useCurrencyContext();
  const [error, setError] = useState({ msg: "", open: false });
  const encodedToken = useMemo(() => getEncodedToken(token), [token]);
  const tokenAmount = useMemo(() => token.proofs.reduce((r, c) => r + c.amount, 0), [token]);
  const qrSize = useMemo(
    () => Math.round(Math.max(196, Math.min(288, width - 96, height * 0.32))),
    [height, width],
  );
  const manager = useManager();
  // For tokens, always show sats as primary (tokens ARE in sats)
  // Show fiat equivalent as secondary info if user prefers fiat
  const fiatEquivalent = formatBalance ? formatAmount(tokenAmount) : null;
  //TODO: Add spent check
  const spent = false;
  const { copied, copy } = useCopy();
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
            <Stack style={styles.amountStage}>
              <AppText
                style={[styles.tokenAmount, { color: theme.accent }]}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
                numberOfLines={1}
                testID={`${formatInt(tokenAmount)}-txt`}
              >
                {formatInt(tokenAmount)}
              </AppText>
              <AppText
                style={[styles.tokenFormat, { color: theme.textSecondary }]}
                testID={`${formatSatStr(tokenAmount, "standard", false)}-txt`}
              >
                {formatSatStr(tokenAmount, "standard", false)}
              </AppText>
              {fiatEquivalent && (
                <AppText
                  style={[styles.fiatEquivalent, { color: theme.textSecondary }]}
                  testID={`${`≈ ${fiatEquivalent.symbol}${fiatEquivalent.formatted}`}-txt`}
                >{`≈ ${fiatEquivalent.symbol}${fiatEquivalent.formatted}`}</AppText>
              )}
            </Stack>

            <Stack style={styles.qrStage}>
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

            <Stack style={styles.actions}>
              <Button
                txt={t(copied ? "copied" : "copyToken")}
                onPress={() => void copy(encodedToken)}
                icon={<CopyIcon width={18} height={18} color={theme.white} />}
              />
              <Button
                outlined
                txt={t("share")}
                onPress={() => void share(encodedToken, `cashu://${encodedToken}`)}
                icon={<ShareIcon width={18} height={18} color={theme.accent} />}
              />
            </Stack>
          </Stack>
        )}
      </ScrollView>
    </Screen>
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
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 22,
    paddingTop: 12,
  },
  amountStage: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 132,
    width: "100%",
    paddingHorizontal: 18,
  },
  tokenAmount: {
    fontSize: fontScale(64),
    fontWeight: "600",
    lineHeight: fontScale(82),
    maxWidth: "100%",
    textAlign: "center",
  },
  tokenFormat: {
    fontSize: fontScale(16),
    fontWeight: "500",
    lineHeight: fontScale(22),
    marginTop: -4,
    textAlign: "center",
  },
  fiatEquivalent: {
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    marginTop: 6,
    textAlign: "center",
  },
  qrStage: {
    alignItems: "center",
    justifyContent: "center",
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
  actions: {
    gap: 12,
    width: "100%",
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
