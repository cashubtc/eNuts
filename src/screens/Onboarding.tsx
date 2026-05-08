import Logo from "@comps/Logo";
import RadioBtn from "@comps/RadioBtn";
import type { TOnboardingPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { store } from "@src/storage/store";
import { STORE_KEYS } from "@src/storage/store/consts";
import { AppText, appFontSize, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet } from "react-native";
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
          backgroundColor: theme.onboardingAlpha,
          image: <Logo size={130} />,
          title: "Alpha Testing",
          subtitle: (
            <Stack
              style={{
                padding: 10,
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <AppText
                style={[{ paddingHorizontal: 10, textAlign: "center" }]}
                testID={"eNuts is currently in alpha testing. Please use at your own risk.-txt"}
              >
                eNuts is currently in alpha testing. Please use at your own risk.
              </AppText>
              <PressableSurface
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 24,
                }}
                onPress={() => setAccepted((acpt) => !acpt)}
                activeOpacity={0.7}
                testID="onboarding-accept-checkbox"
              >
                <Stack
                  style={{
                    width: 10,
                    borderWidth: 1,
                    borderColor: theme.white,
                    height: 10,
                    backgroundColor: accepted ? theme.white : "transparent",
                  }}
                />
                <AppText style={[{ marginLeft: 10 }]} testID={"I understand-txt"}>
                  I understand
                </AppText>
              </PressableSurface>
            </Stack>
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
        <PressableSurface
          onPress={() => void handleDone()}
          style={{ marginRight: 20 }}
          testID="onboarding-done"
        >
          <AppText style={[{ color: theme.white }]} testID={`${t("next")}-txt`}>
            {t("next")}
          </AppText>
        </PressableSurface>
      )}
    />
  );
}
const styles = StyleSheet.create({
  title: { fontSize: appFontSize.display, fontWeight: "500" },
  subTitle: { fontSize: appFontSize.bodyLarge },
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
