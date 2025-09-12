import Button from "@comps/Button";
import { ExclamationIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { isIOS } from "@src/consts";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { useQRScanHandler } from "@util/qrScanner";
import TrustMintBottomSheet, {
  type TrustMintBottomSheetRef,
} from "@modal/TrustMintBottomSheet";
import { globals, mainColors } from "@styles";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

const alreadySpentErr = "Token already spent.";

export default function ProcessingErrorScreen({
  navigation,
  route,
}: TProcessingErrorPageProps) {
  const { scan, comingFromOnboarding, errorMsg } = route.params;

  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const trustMintRef = useRef<TrustMintBottomSheetRef>(null);
  const { openQRScanner } = useQRScanHandler(
    navigation,
    (token) => trustMintRef.current?.open(token) as Promise<any>
  );

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View style={[globals(color).container, styles.container]}>
      <View />
      <View style={styles.section}>
        <ExclamationIcon
          width={s(60)}
          height={s(60)}
          color={mainColors.ERROR}
        />
        <Txt
          txt={errorMsg}
          bold
          center
          styles={[
            {
              color: mainColors.ERROR,
              marginVertical: vs(15),
              fontSize: vs(18),
            },
          ]}
        />
        {!scan && errorMsg !== alreadySpentErr && (
          <Txt
            center
            styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
            txt={t("tryLater")}
          />
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
        {scan && (
          <>
            <Button txt={t("scanAgain")} onPress={() => void openQRScanner()} />
            <View style={{ marginVertical: vs(10) }} />
          </>
        )}
        <Button
          outlined={scan}
          txt={t("backToDashboard")}
          onPress={() => {
            if (comingFromOnboarding) {
              return navigation.navigate("auth", { pinHash: "" });
            }
            navigation.navigate("dashboard");
          }}
        />
        <TrustMintBottomSheet ref={trustMintRef} />
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "20@s",
    paddingBottom: isIOS ? "40@s" : "20@s",
  },
  section: {
    alignItems: "center",
  },
  errMsg: {
    color: mainColors.ERROR,
    marginVertical: "15@vs",
    fontSize: "18@vs",
  },
  hint: {
    fontSize: "14@vs",
    marginTop: "10@vs",
  },
});
