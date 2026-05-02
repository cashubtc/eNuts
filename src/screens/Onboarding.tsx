import Logo from "@comps/Logo";
import RadioBtn from "@comps/RadioBtn";
import Txt from "@comps/Txt";
import type { TOnboardingPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { store } from "@src/storage/store";
import { STORE_KEYS } from "@src/storage/store/consts";
import { useAppThemeTokens } from "@styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, TouchableOpacity, View, StyleSheet } from "react-native";
import Onboarding from "react-native-onboarding-swiper";

export default function OnboardingScreen({ navigation }: TOnboardingPageProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const [accepted, setAccepted] = useState(false);
  const handleDone = async () => {
    await store.set(STORE_KEYS.explainer, "1");
    navigation.replace("dashboard");
  };
  return (
    <Onboarding
      onDone={() => void handleDone()}
      showDone={accepted}
      showSkip={accepted}
      showNext={accepted}
      pages={[
        {
          backgroundColor: "black",
          image: <Logo size={130} />,
          title: "Alpha Testing",
          subtitle: (
            <View
              style={{
                padding: 10,
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Txt
                txt="eNuts is currently in alpha testing. Please use at your own risk."
                styles={[{ paddingHorizontal: 10, textAlign: "center" }]}
              />
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 24,
                }}
                onPress={() => setAccepted((acpt) => !acpt)}
                activeOpacity={0.7}
                testID="onboarding-accept-checkbox"
              >
                <View
                  style={{
                    width: 10,
                    borderWidth: 1,
                    borderColor: "white",
                    height: 10,
                    backgroundColor: accepted ? "white" : "transparent",
                  }}
                />
                <Txt txt="I understand" styles={[{ marginLeft: 10 }]} />
              </TouchableOpacity>
            </View>
          ),
        },
        {
          backgroundColor: theme.onboardingDefault,
          image: <Logo size={130} />,
          title: "eNuts & Ecash",
          subtitle: t("explainer1"),
        },
        {
          backgroundColor: theme.onboardingCashu,

          image: <Image style={styles.cashuImg} source={require("@assets/cashu.png")} />,
          title: "Cashu & Mints",
          subtitle: t("explainer2"),
        },
        {
          backgroundColor: theme.onboardingNuts,

          image: (
            <Image style={styles.sendReceiveImg} source={require("@assets/send_receive.png")} />
          ),
          title: t("send&receive"),
          subtitle: t("explainer3"),
        },
      ]}
      transitionAnimationDuration={250}
      titleStyles={styles.title}
      subTitleStyles={styles.subTitle}
      nextLabel={t("next")}
      skipLabel={t("skip")}
      onSkip={() => void handleDone()}
      DoneButtonComponent={() => (
        <TouchableOpacity
          onPress={() => void handleDone()}
          style={{ marginRight: 20 }}
          testID="onboarding-done"
        >
          <Txt txt={t("next")} styles={[{ color: theme.white }]} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "500" },
  subTitle: { fontSize: 16 },
  cashuImg: {
    width: 130,
    height: 130,
    resizeMode: "contain",
  },
  sendReceiveImg: {
    width: 300,
    height: 170,
    resizeMode: "contain",
  },
});
