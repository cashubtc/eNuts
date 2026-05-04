import { AppText, fontScale, useAppThemeTokens, Stack } from "@styles";
import Copy from "@comps/Copy";
import Separator from "@comps/Separator";
import { StyleSheet } from "react-native";
const truncateStr = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};
type TokenSectionProps = {
  label: string;
  value: string;
};
export function TokenSection({ label, value }: TokenSectionProps) {
  const theme = useAppThemeTokens();
  return (
    <>
      <Separator style={styles.separator} />
      <Stack style={styles.tokenSection}>
        <Stack style={styles.tokenHeader}>
          <AppText style={[styles.sectionTitle, { color: theme.text }]} testID={`${label}-txt`}>
            {label}
          </AppText>
          <Copy txt={value} />
        </Stack>
        <Stack style={[styles.tokenContainer, { backgroundColor: theme.inputBackground }]}>
          <AppText
            style={[styles.tokenValue, { color: theme.textSecondary }]}
            testID={`${truncateStr(value, 100)}-txt`}
          >
            {truncateStr(value, 100)}
          </AppText>
        </Stack>
      </Stack>
    </>
  );
}
const styles = StyleSheet.create({
  separator: {
    marginVertical: 10,
  },
  tokenSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: "600",
  },
  tokenValue: {
    fontSize: fontScale(14),
  },
  tokenContainer: {
    padding: 10,
    borderRadius: 8,
  },
});
