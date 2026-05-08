import Button from "@comps/Button";
import { ExclamationIcon } from "@comps/Icons";
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { isIOS } from "@src/consts";
import { NS } from "@src/i18n";
import TrustMintBottomSheet, { type TrustMintBottomSheetRef } from "@modal/TrustMintBottomSheet";
import { AppText, appFontSize, globals, useAppThemeTokens, Stack } from "@styles";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
const alreadySpentErr = "Token already spent.";
export default function ProcessingErrorScreen({ navigation, route }: TProcessingErrorPageProps) {
  const { scan, comingFromOnboarding, errorMsg } = route.params;
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const trustMintRef = useRef<TrustMintBottomSheetRef>(null);
  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);
  return (
    <Stack style={[globals().container, { backgroundColor: theme.background }, styles.container]}>
      <Stack />
      <Stack style={styles.section}>
        <ExclamationIcon width={60} height={60} color={theme.error} />
        <AppText
          style={[
            {
              color: theme.error,
              marginVertical: 15,
              fontSize: appFontSize.label,
            },
          ]}
          weight="medium"
          align="center"
          testID={`${errorMsg}-txt`}
        >
          {errorMsg}
        </AppText>
        {!scan && errorMsg !== alreadySpentErr && (
          <AppText
            style={[styles.hint, { color: theme.textSecondary }]}
            align="center"
            testID={`${t("tryLater")}-txt`}
          >
            {t("tryLater")}
          </AppText>
        )}
        {errorMsg === alreadySpentErr && (
          <AppText
            style={[styles.hint, { color: theme.textSecondary }]}
            align="center"
            testID={`${t("alreadySpentHint")}-txt`}
          >
            {t("alreadySpentHint")}
          </AppText>
        )}
      </Stack>
      <Stack style={{ width: "100%" }}>
        <Button
          outlined={scan}
          txt={t("backToDashboard")}
          onPress={() => {
            navigation.navigate("dashboard");
          }}
        />
        <TrustMintBottomSheet ref={trustMintRef} />
      </Stack>
    </Stack>
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
  hint: {
    fontSize: appFontSize.body,
    marginTop: 10,
  },
});
