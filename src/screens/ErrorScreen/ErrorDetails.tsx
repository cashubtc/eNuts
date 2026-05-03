import { repoIssueUrl } from "@consts/urls";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { AppText, fontScale, useAppThemeTokens } from "@styles";
import { isErr, openUrl } from "@util";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View, StyleSheet } from "react-native";
export interface ErrorDetailsProps {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError(): void;
}
export function ErrorDetails(props: ErrorDetailsProps) {
  const { t } = useTranslation([NS.error]);
  const { openPromptAutoClose } = usePromptContext();
  const theme = useAppThemeTokens();
  return (
    <View style={styles.container}>
      <AppText style={[styles.header]} weight="medium" testID={`${t("header")}-txt`}>
        {t("header")}
      </AppText>
      <AppText style={[{ marginBottom: 20 }]} testID={`${t("msg")}-txt`}>
        {t("msg")}
      </AppText>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={[{ color: theme.error }]} testID={`${props.error.message}-txt`}>
          {props.error.message}
        </AppText>
        <AppText testID={`${props?.componentStack || t("stackNA")}-txt`}>
          {props?.componentStack || t("stackNA")}
        </AppText>
      </ScrollView>
      <TouchableOpacity
        onPress={() =>
          void openUrl(repoIssueUrl)?.catch((err: unknown) =>
            openPromptAutoClose({
              msg: isErr(err) ? err.message : t("deepLinkErr", { ns: NS.common }),
            }),
          )
        }
        style={styles.bugReport}
      >
        <AppText
          weight="medium"
          align="center"
          testID={`${`${t("reportBug")}  🐛`}-txt`}
        >{`${t("reportBug")}  🐛`}</AppText>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 80,
  },
  header: {
    fontSize: fontScale(22),
    marginBottom: 30,
    textAlign: "center",
  },
  scroll: {
    marginBottom: 20,
  },
  bugReport: {
    padding: 20,
  },
});
