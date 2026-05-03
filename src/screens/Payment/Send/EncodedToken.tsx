import { getEncodedToken } from "@cashu/cashu-ts";
import Button from "@comps/Button";
import useCopy from "@comps/hooks/Copy";
import { CopyIcon, ShareIcon } from "@comps/Icons";
import QR from "@comps/QR";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { preventBack } from "@nav/utils";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { fontScale, globals, useAppThemeTokens } from "@styles";
import { formatInt, formatSatStr, share } from "@util";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, StyleSheet } from "react-native";
import { useManager } from "@src/context/Manager";

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
  const { token } = route.params || {};
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { formatBalance, formatAmount } = useCurrencyContext();
  const [error, setError] = useState({ msg: "", open: false });
  const encodedToken = useMemo(() => getEncodedToken(token), [token]);
  const tokenAmount = useMemo(() => token.proofs.reduce((r, c) => r + c.amount, 0), [token]);
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
      screenName={!spent ? `${t("newToken")}  🥜🐿️` : undefined}
      handlePress={() => navigation.navigate("dashboard")}
      withPadding={false}
    >
      <View style={styles.container}>
        {spent ? (
          <>
            <View />
            <View>
              <Text style={[styles.successTxt, { color: theme.text }]}>
                {t("isSpent", { ns: NS.history })}
              </Text>
              <View style={styles.successAnim}>
                <LottieView
                  source={require("../../../../assets/lottie/success.json")}
                  autoPlay
                  loop={false}
                  style={styles.lottie}
                  renderMode="HARDWARE"
                />
              </View>
            </View>
            <Button txt={t("backToDashboard")} onPress={() => navigation.navigate("dashboard")} />
          </>
        ) : (
          <>
            {/* The amount of the created token */}
            <View style={styles.qrWrap}>
              <Txt
                txt={formatInt(tokenAmount)}
                styles={[styles.tokenAmount, { color: theme.accent }]}
              />
              <Txt
                txt={formatSatStr(tokenAmount, "standard", false)}
                styles={[styles.tokenFormat]}
              />
              {fiatEquivalent && (
                <Txt
                  txt={`≈ ${fiatEquivalent.symbol}${fiatEquivalent.formatted}`}
                  styles={[styles.fiatEquivalent, { color: theme.textSecondary }]}
                />
              )}
              {/* The QR code */}
              {error.open ? (
                <Txt
                  txt={error.msg}
                  styles={[globals().navTxt, { color: theme.text }, styles.errorMsg]}
                />
              ) : (
                <QR
                  size={280}
                  value={encodedToken}
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
            </View>
            <View style={styles.fullWidth}>
              {error.open && (
                <>
                  <Button
                    txt={t(copied ? "copied" : "copyToken")}
                    onPress={() => void copy(encodedToken)}
                    icon={<CopyIcon width={18} height={18} color={theme.white} />}
                  />
                  <View style={{ marginVertical: 10 }} />
                </>
              )}
              <Button
                outlined
                txt={t("share")}
                onPress={() => void share(encodedToken, `cashu://${encodedToken}`)}
                icon={<ShareIcon width={18} height={18} color={theme.accent} />}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 20,
  },
  qrWrap: {
    alignItems: "center",
  },
  tokenAmount: {
    fontSize: fontScale(40),
    fontWeight: "500",
    marginTop: 20,
  },
  tokenFormat: {
    marginBottom: 5,
  },
  fiatEquivalent: {
    fontSize: fontScale(14),
    marginBottom: 15,
  },
  errorMsg: {
    marginVertical: 25,
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
  fullWidth: {
    width: "100%",
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
