import { getEncodedToken } from "@cashu/cashu-ts";
import Button from "@comps/Button";
import useCopy from "@comps/hooks/Copy";
import { CopyIcon, ShareIcon } from "@comps/Icons";
import QR from "@comps/QR";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { preventBack } from "@nav/utils";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatInt, formatSatStr, share } from "@util";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useManager } from "@src/context/Manager";

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
  const { token } = route.params || {};
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
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
              <Text style={[styles.successTxt, { color: color.TEXT }]}>
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
                styles={[styles.tokenAmount, { color: hi[highlight] }]}
              />
              <Txt
                txt={formatSatStr(tokenAmount, "standard", false)}
                styles={[styles.tokenFormat]}
              />
              {fiatEquivalent && (
                <Txt
                  txt={`≈ ${fiatEquivalent.symbol}${fiatEquivalent.formatted}`}
                  styles={[styles.fiatEquivalent, { color: color.TEXT_SECONDARY }]}
                />
              )}
              {/* The QR code */}
              {error.open ? (
                <Txt txt={error.msg} styles={[globals(color).navTxt, styles.errorMsg]} />
              ) : (
                <QR
                  size={s(280)}
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
                    icon={<CopyIcon width={s(18)} height={s(18)} color={mainColors.WHITE} />}
                  />
                  <View style={{ marginVertical: s(10) }} />
                </>
              )}
              <Button
                outlined
                txt={t("share")}
                onPress={() => void share(encodedToken, `cashu://${encodedToken}`)}
                icon={<ShareIcon width={s(18)} height={s(18)} color={hi[highlight]} />}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "20@s",
  },
  qrWrap: {
    alignItems: "center",
  },
  tokenAmount: {
    fontSize: "40@vs",
    fontWeight: "500",
    marginTop: "20@vs",
  },
  tokenFormat: {
    marginBottom: "5@vs",
  },
  fiatEquivalent: {
    fontSize: "14@vs",
    marginBottom: "15@vs",
  },
  errorMsg: {
    marginVertical: "25@vs",
    textAlign: "center",
  },
  successTxt: {
    fontSize: "28@vs",
    fontWeight: "800",
    textAlign: "center",
    marginTop: "30@vs",
  },
  successAnim: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20@vs",
  },
  fullWidth: {
    width: "100%",
  },
  lottie: {
    width: "100@s",
    height: "100@s",
  },
});
