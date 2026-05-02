import Screen from "@comps/Screen";
import { NS } from "@src/i18n";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { ReactNode } from "react";

type HistoryDetailsScreenProps = {
  onGoBack: () => void;
  children: ReactNode;
};

export function HistoryDetailsScreen({ onGoBack, children }: HistoryDetailsScreenProps) {
  const { t } = useTranslation([NS.history]);

  return (
    <Screen screenName={t("details")} withBackBtn handlePress={onGoBack}>
      <ScrollView style={styles.scrollContainer}>{children}</ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
});
