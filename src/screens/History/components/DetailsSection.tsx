import { useAppThemeTokens } from "@styles";
import Txt from "@comps/Txt";
import { View, StyleSheet } from "react-native";
import { ReactNode } from "react";

type DetailsSectionProps = {
  children: ReactNode;
};

export function DetailsSection({ children }: DetailsSectionProps) {
  return <View style={styles.details}>{children}</View>;
}

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const theme = useAppThemeTokens();

  return (
    <View style={styles.detailRow}>
      <Txt txt={label} styles={[styles.detailLabel, { color: theme.textSecondary }]} />
      <Txt txt={value} styles={[styles.detailValue, { color: theme.text }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  details: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
});
