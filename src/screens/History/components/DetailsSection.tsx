import { AppText, fontScale, useAppThemeTokens, Stack } from "@styles";
import { StyleSheet } from "react-native";
import { ReactNode } from "react";
type DetailsSectionProps = {
  children: ReactNode;
};
export function DetailsSection({ children }: DetailsSectionProps) {
  return <Stack style={styles.details}>{children}</Stack>;
}
type DetailRowProps = {
  label: string;
  value: string;
};
export function DetailRow({ label, value }: DetailRowProps) {
  const theme = useAppThemeTokens();
  return (
    <Stack style={styles.detailRow}>
      <AppText style={[styles.detailLabel, { color: theme.textSecondary }]} testID={`${label}-txt`}>
        {label}
      </AppText>
      <AppText style={[styles.detailValue, { color: theme.text }]} testID={`${value}-txt`}>
        {value}
      </AppText>
    </Stack>
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
    fontSize: fontScale(14),
  },
  detailValue: {
    fontSize: fontScale(14),
  },
});
