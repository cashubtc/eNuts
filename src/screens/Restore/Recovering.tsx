import Button from "@comps/Button";
import Loading from "@comps/Loading";
import Logo from "@comps/Logo";
import Progress from "@comps/Progress";
import Txt from "@comps/Txt";
import type { IRecoveringPageProps, TBeforeRemoveEvent } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useKnownMints } from "@src/context/KnownMints";
import { useManager } from "@src/context/Manager";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { vib } from "@src/util";
import { globals } from "@styles";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

// TODO
// show internet connection status
// show different quotes messages during the process

export default function RecoveringScreen({ navigation }: IRecoveringPageProps) {
  const manager = useManager();
  const { t } = useTranslation([NS.common]);
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { knownMints } = useKnownMints();

  useEffect(() => {
    const restore = async () => {
      try {
        for (let i = 0; i < knownMints.length; i++) {
          const mintUrl = knownMints[i].mintUrl;
          await manager.wallet.restore(mintUrl);
          setCurrent(i + 1);
        }
        setIsDone(true);
        vib(300);
      } catch (e) {
        setError("Restore failed");
      }
    };
    restore();
  }, []);

  const { color } = useThemeContext();

  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  const progress = useMemo(() => {
    if (!knownMints?.length) return 0;
    return Math.min(1, current / knownMints.length);
  }, [current, knownMints]);

  if (isDone) {
    return (
      <View
        style={[styles.containerSuccess, { backgroundColor: color.BACKGROUND }]}
      >
        <View pointerEvents="none" style={styles.confetti}>
          <LottieView
            source={require("../../../assets/lottie/confetti.json")}
            autoPlay
            loop={false}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <Logo size={s(230)} style={styles.img} success />
        <View style={{ width: "100%" }}>
          <Text style={[styles.successTxt, { color: color.TEXT }]}>
            Wallet restored!
          </Text>
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
          <Button
            txt={t("backToDashboard")}
            onPress={() => navigation.navigate("dashboard")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[globals(color).container, styles.container]}>
      <Loading size={s(35)} />
      <Txt styles={[styles.descText]} txt={t("recoveringWallet")} />
      <View style={{ width: "100%", paddingHorizontal: s(20) }}>
        <Progress progress={progress} />
        <Txt
          center
          styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
          txt={`${t("restored")} ${current}/${knownMints.length}`}
        />
        <Txt
          center
          styles={[
            styles.hint,
            { color: color.TEXT_SECONDARY, marginTop: vs(6) },
          ]}
          txt={t("dontClose")}
        />
      </View>
      {error && <Txt center styles={[styles.errorTxt]} txt={error} />}
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
  },
  descText: {
    marginTop: "20@s",
    marginBottom: "30@s",
    textAlign: "center",
    fontSize: "20@s",
  },
  hint: {
    fontSize: "12@s",
    marginTop: "10@s",
  },
  errorTxt: {
    fontSize: "12@s",
    marginTop: "14@s",
    color: "#ff5a5f",
  },
  // Success styles
  containerSuccess: {
    flex: 1,
    padding: "20@s",
  },
  img: {
    marginTop: "90@s",
    height: "90@s",
    opacity: 0.8,
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
  lottie: {
    width: "100@s",
    height: "100@s",
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
});
