import Logo from "@comps/Logo";
import RadioBtn from "@comps/RadioBtn";
import Txt from "@comps/Txt";
import type { TOnboardingPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { store } from "@src/storage/store";
import { STORE_KEYS } from "@src/storage/store/consts";
import { H_Colors, mainColors } from "@styles/colors";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, TouchableOpacity, View } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { s, ScaledSheet } from "react-native-size-matters";

export default function OnboardingScreen({ navigation }: TOnboardingPageProps) {
  const { t } = useTranslation([NS.common]);
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
          image: <Logo size={s(130)} />,
          title: "Alpha Testing",
          subtitle: (
            <View
              style={{
                padding: s(10),
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Txt
                txt="eNuts is currently in alpha testing. Please use at your own risk."
                styles={[{ paddingHorizontal: s(10), textAlign: "center" }]}
              />
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: s(24),
                }}
                onPress={() => setAccepted((acpt) => !acpt)}
                activeOpacity={0.7}
                testID="onboarding-accept-checkbox"
              >
                <View
                  style={{
                    width: s(10),
                    borderWidth: 1,
                    borderColor: "white",
                    height: s(10),
                    backgroundColor: accepted ? "white" : "transparent",
                  }}
                />
                <Txt txt="I understand" styles={[{ marginLeft: s(10) }]} />
              </TouchableOpacity>
            </View>
          ),
        },
        {
          backgroundColor: H_Colors.Default,
          image: <Logo size={s(130)} />,
          title: "eNuts & Ecash",
          subtitle: t("explainer1"),
        },
        {
          backgroundColor: "#8038CA",

          image: (
            <Image
              style={styles.cashuImg}
              source={require("@assets/cashu.png")}
            />
          ),
          title: "Cashu & Mints",
          subtitle: t("explainer2"),
        },
        {
          backgroundColor: H_Colors.Nuts,

          image: (
            <Image
              style={styles.sendReceiveImg}
              source={require("@assets/send_receive.png")}
            />
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
          style={{ marginRight: s(20) }}
          testID="onboarding-done"
        >
          <Txt txt={t("next")} styles={[{ color: mainColors.WHITE }]} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = ScaledSheet.create({
  title: { fontSize: "28@vs", fontWeight: "500" },
  subTitle: { fontSize: "16@vs" },
  cashuImg: {
    width: "130@s",
    height: "130@vs",
    resizeMode: "contain",
  },
  sendReceiveImg: {
    width: "300@s",
    height: "170@vs",
    resizeMode: "contain",
  },
});
