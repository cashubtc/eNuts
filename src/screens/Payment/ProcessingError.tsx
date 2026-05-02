import Button from "@comps/Button";
import { ExclamationIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { isIOS } from "@src/consts";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import TrustMintBottomSheet, { type TrustMintBottomSheetRef } from "@modal/TrustMintBottomSheet";
import { globals, mainColors } from "@styles";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";

const alreadySpentErr = "Token already spent.";

export default function ProcessingErrorScreen({ navigation, route }: TProcessingErrorPageProps) {
  const { scan, comingFromOnboarding, errorMsg } = route.params;

  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const trustMintRef = useRef<TrustMintBottomSheetRef>(null);

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View style={[globals(color).container, styles.container]}>
      <View />
      <View style={styles.section}>
        <ExclamationIcon width={60} height={60} color={mainColors.ERROR} />
        <Txt
          txt={errorMsg}
          bold
          center
          styles={[
            {
              color: mainColors.ERROR,
              marginVertical: 15,
              fontSize: 18,
            },
          ]}
        />
        {!scan && errorMsg !== alreadySpentErr && (
          <Txt center styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t("tryLater")} />
        )}
        {errorMsg === alreadySpentErr && (
          <Txt
            center
            styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
            txt={t("alreadySpentHint")}
          />
        )}
      </View>
      <View style={{ width: "100%" }}>
        <Button
          outlined={scan}
          txt={t("backToDashboard")}
          onPress={() => {
            navigation.navigate("dashboard");
          }}
        />
        <TrustMintBottomSheet ref={trustMintRef} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: isIOS ? 40 : 20,
  },
  section: {
    alignItems: "center",
  },
  errMsg: {
    color: mainColors.ERROR,
    marginVertical: 15,
    fontSize: 18,
  },
  hint: {
    fontSize: 14,
    marginTop: 10,
  },
});
