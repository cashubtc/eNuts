import Button from "@comps/Button";
import Logo from "@comps/Logo";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import type { TBeforeRemoveEvent, TSuccessPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useBalanceContext } from "@src/context/Balance";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { isNum, vib } from "@util";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function SuccessPage({ navigation, route }: TSuccessPageProps) {
  const {
    amount,
    memo,
    fee,
    change,
    mint,
    isClaim,
    isMelt,
    isAutoSwap,
    isScanned,
  } = route.params;
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const { formatAmount } = useCurrencyContext();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    vib(400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
      <View pointerEvents="none" style={styles.confetti}>
        <LottieView
          source={require("../../../assets/lottie/confetti.json")}
          autoPlay
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View style={{ width: "100%" }}>
        <Text
          testID={`amount: ${amount}`}
          style={[styles.successTxt, { color: color.TEXT }]}
        >
          {(() => {
            if (isMelt && !isAutoSwap) {
              return t("paymentSuccess");
            }
            if (isAutoSwap) {
              return t("autoSwapSuccess");
            }
            return null;
          })()}
        </Text>
        {memo && (
          <Text style={[styles.mints, { color: color.TEXT_SECONDARY }]}>
            {memo}
          </Text>
        )}
        {mint && mint.length > 0 && (
          <Text
            testID={`mint: ${mint}`}
            style={[styles.mints, { color: color.TEXT_SECONDARY }]}
          >
            {mint}
          </Text>
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
              value={`${formatAmount(amount).formatted} ${
                formatAmount(amount).symbol
              }`}
            />
            <Details
              txt={t("fee")}
              value={`${formatAmount(fee || 0).formatted} ${
                formatAmount(fee || 0).symbol
              }`}
            />
            <Details
              txt={t("totalInclFee")}
              value={`${formatAmount(amount + (fee || 0)).formatted} ${
                formatAmount(amount + (fee || 0)).symbol
              }`}
            />
            {isNum(change) && (
              <Details
                txt={t("change")}
                value={`${formatAmount(change).formatted} ${
                  formatAmount(change).symbol
                }`}
              />
            )}
          </View>
        )}
      </View>
      <View
        style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}
      >
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
      <Txt txt={txt} styles={[styles.meltTxt]} />
      <Txt txt={value} styles={[styles.meltTxt]} />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: "20@s",
  },
  img: {
    marginTop: "90@s",
    height: "90@s",
    opacity: 0.8,
  },
  nostrImg: {
    marginTop: "90@vs",
    justifyContent: "center",
    alignItems: "center",
  },
  successTxt: {
    fontSize: "28@vs",
    fontWeight: "800",
    textAlign: "center",
    marginTop: "30@vs",
  },
  meltWrap: {
    width: "100%",
    marginTop: "20@vs",
  },
  meltOverview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10@vs",
  },
  meltTxt: {
    fontWeight: "500",
  },
  mints: {
    marginTop: "20@vs",
    fontSize: "14@vs",
    textAlign: "center",
    fontWeight: "500",
  },
  btnWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    paddingHorizontal: "20@s",
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
    marginTop: "20@vs",
  },
  lottie: {
    width: "100@s",
    height: "100@s",
  },
});
