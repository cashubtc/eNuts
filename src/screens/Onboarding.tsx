import Logo from "@comps/Logo";
import Txt from "@comps/Txt";
import type { TOnboardingPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { store } from "@src/storage/store";
import { STORE_KEYS } from "@src/storage/store/consts";
import { H_Colors, mainColors } from "@styles/colors";
import { useTranslation } from "react-i18next";
import { Image, TouchableOpacity } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { s, ScaledSheet } from "react-native-size-matters";

export default function OnboardingScreen({ navigation }: TOnboardingPageProps) {
  const { t } = useTranslation([NS.common]);
  const handleDone = async () => {
    await store.set(STORE_KEYS.explainer, "1");
    navigation.navigate("Restore", {
      screen: "Seed",
      params: { comingFromOnboarding: true },
    });
  };
  return (
    <Onboarding
      onDone={() => void handleDone()}
      pages={[
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
