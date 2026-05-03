import { AppText, fontScale, useAppThemeTokens } from "@styles";
import Button from "@comps/Button";
import Logo from "@comps/Logo";
import { isIOS } from "@consts";
import type { TBeforeRemoveEvent, TSuccessPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useBalanceContext } from "@src/context/Balance";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { isNum, vib } from "@util";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function SuccessPage({ navigation, route }: TSuccessPageProps) {
  const { amount, memo, fee, change, mint, isClaim, isMelt, isAutoSwap, isScanned } = route.params;
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    vib(400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={styles.confetti}>
        <LottieView
          source={require("../../../assets/lottie/confetti.json")}
          autoPlay
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View style={{ width: "100%" }}>
        <AppText testID={`amount: ${amount}`} style={[styles.successTxt, { color: theme.text }]}>
          {(() => {
            if (isMelt && !isAutoSwap) {
              return t("paymentSuccess");
            }
            if (isAutoSwap) {
              return t("autoSwapSuccess");
            }
            return null;
          })()}
        </AppText>
        {memo && <AppText style={[styles.mints, { color: theme.textSecondary }]}>{memo}</AppText>}
        {mint && mint.length > 0 && (
          <AppText testID={`mint: ${mint}`} style={[styles.mints, { color: theme.textSecondary }]}>
            {mint}
          </AppText>
        )}
        <View style={styles.successAnim}>
          <LottieView
            source={require("../../../assets/lottie/success.json")}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>
        {(isMelt || isAutoSwap) && amount && (
          <View style={styles.meltWrap}>
            <Details
              txt={t(isAutoSwap ? "swapped" : "paidOut", {
                ns: NS.wallet,
              })}
              value={`${formatAmount(amount).formatted} ${formatAmount(amount).symbol}`}
            />
            <Details
              txt={t("fee")}
              value={`${formatAmount(fee || 0).formatted} ${formatAmount(fee || 0).symbol}`}
            />
            <Details
              txt={t("totalInclFee")}
              value={`${formatAmount(amount + (fee || 0)).formatted} ${formatAmount(amount + (fee || 0)).symbol}`}
            />
            {isNum(change) && (
              <Details
                txt={t("change")}
                value={`${formatAmount(change).formatted} ${formatAmount(change).symbol}`}
              />
            )}
          </View>
        )}
      </View>
      <View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
        <Button
          txt={t("backToDashboard")}
          onPress={() => {
            navigation.navigate("dashboard");
          }}
        />
      </View>
    </View>
  );
}
function Details({ txt, value }: { txt: string; value: string }) {
  return (
    <View style={styles.meltOverview}>
      <AppText style={[styles.meltTxt]} testID={`${txt}-txt`}>
        {txt}
      </AppText>
      <AppText style={[styles.meltTxt]} testID={`${value}-txt`}>
        {value}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  img: {
    marginTop: 90,
    height: 90,
    opacity: 0.8,
  },
  nostrImg: {
    marginTop: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  successTxt: {
    fontSize: fontScale(28),
    fontWeight: "800",
    textAlign: "center",
    marginTop: 30,
  },
  meltWrap: {
    width: "100%",
    marginTop: 20,
  },
  meltOverview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  meltTxt: {
    fontWeight: "500",
  },
  mints: {
    marginTop: 20,
    fontSize: fontScale(14),
    textAlign: "center",
    fontWeight: "500",
  },
  btnWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    paddingHorizontal: 20,
  },
  confetti: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  successAnim: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
