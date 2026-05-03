import Button from "@comps/Button";
import Loading from "@comps/Loading";
import Logo from "@comps/Logo";
import Progress from "@comps/Progress";
import type { IRecoveringPageProps, TBeforeRemoveEvent } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useManager } from "@src/context/Manager";
import { NS } from "@src/i18n";
import { appLogger } from "@src/logger";
import { vib } from "@src/util";
import { AppText, fontScale, globals, useAppThemeTokens } from "@styles";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// TODO
// show internet connection status
// show different quotes messages during the process
export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {
  const manager = useManager();
  const { t } = useTranslation([NS.common]);
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bip39seed, mintUrls } = route.params;
  useEffect(() => {
    const restore = async () => {
      try {
        for (let i = 0; i < mintUrls.length; i++) {
          const mintUrl = mintUrls[i];
          await manager.wallet.sweep(mintUrl, bip39seed);
          setCurrent(i + 1);
        }
        setIsDone(true);
        vib(300);
      } catch (e) {
        setError("Restore failed");
        appLogger.error("Restore failed", { error: e });
        setTimeout(() => {
          navigation.navigate("dashboard");
        }, 3000);
      }
    };
    restore();
  }, []);
  const theme = useAppThemeTokens();
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);
  const progress = useMemo(() => {
    if (!mintUrls?.length) return 0;
    return Math.min(1, current / mintUrls.length);
  }, [current, mintUrls]);
  if (isDone) {
    return (
      <View style={[styles.containerSuccess, { backgroundColor: theme.background }]}>
        <View pointerEvents="none" style={styles.confetti}>
          <LottieView
            source={require("../../../assets/lottie/confetti.json")}
            autoPlay
            loop={false}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <Logo size={230} style={styles.img} success />
        <View style={{ width: "100%" }}>
          <AppText style={[styles.successTxt, { color: theme.text }]}>Wallet restored!</AppText>
          <View style={styles.successAnim}>
            <LottieView
              source={require("../../../assets/lottie/success.json")}
              autoPlay
              loop={false}
              style={styles.lottie}
            />
          </View>
        </View>
        <View style={[styles.btnWrap, { marginBottom: insets.bottom || 20 }]}>
          <Button txt={t("backToDashboard")} onPress={() => navigation.navigate("dashboard")} />
        </View>
      </View>
    );
  }
  return (
    <View style={[globals().container, { backgroundColor: theme.background }, styles.container]}>
      <Loading size={35} />
      <AppText style={[styles.descText]} testID={`${t("recoveringWallet")}-txt`}>
        {t("recoveringWallet")}
      </AppText>
      <View style={{ width: "100%", paddingHorizontal: 20 }}>
        <Progress progress={progress} />
        <AppText
          style={[styles.hint, { color: theme.textSecondary }]}
          align="center"
          testID={`${`${t("restored")} ${current}/${mintUrls.length}`}-txt`}
        >{`${t("restored")} ${current}/${mintUrls.length}`}</AppText>
        <AppText
          style={[styles.hint, { color: theme.textSecondary, marginTop: 6 }]}
          align="center"
          testID={`${t("dontClose")}-txt`}
        >
          {t("dontClose")}
        </AppText>
      </View>
      {error && (
        <AppText
          style={[styles.errorTxt, { color: theme.error }]}
          align="center"
          testID={`${error}-txt`}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  descText: {
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
    fontSize: fontScale(20),
  },
  hint: {
    fontSize: fontScale(12),
    marginTop: 10,
  },
  errorTxt: {
    fontSize: fontScale(12),
    marginTop: 14,
  },
  // Success styles
  containerSuccess: {
    flex: 1,
    padding: 20,
  },
  img: {
    marginTop: 90,
    height: 90,
    opacity: 0.8,
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
  lottie: {
    width: 100,
    height: 100,
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
});
