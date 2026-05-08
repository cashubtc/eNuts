import { AppText, appFontSize, useAppThemeTokens, Stack } from "@styles";
import { useCurrencyContext } from "@src/context/Currency";
import { StyleSheet } from "react-native";
type HistoryOverviewProps = {
  amount: number;
  amountPrefix: "+" | "-";
  amountColor: string;
  typeLabel: string;
  description: string;
};
export function HistoryOverview({
  amount,
  amountPrefix,
  amountColor,
  typeLabel,
  description,
}: HistoryOverviewProps) {
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const { formatted, symbol } = formatAmount(amount);
  const amountDisplay = `${amountPrefix}${formatted} ${symbol}`;
  return (
    <Stack style={styles.overview}>
      <AppText style={[styles.amount, { color: amountColor }]} testID={`${amountDisplay}-txt`}>
        {amountDisplay}
      </AppText>
      <AppText style={[styles.type, { color: theme.textSecondary }]} testID={`${typeLabel}-txt`}>
        {typeLabel}
      </AppText>
      <AppText
        style={[styles.description, { color: theme.textSecondary }]}
        testID={`${description}-txt`}
      >
        {description}
      </AppText>
    </Stack>
  );
}
const styles = StyleSheet.create({
  overview: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  amount: {
    fontSize: appFontSize.overviewAmount,
    fontWeight: "600",
  },
  type: {
    fontSize: appFontSize.body,
    marginTop: 5,
  },
  description: {
    fontSize: appFontSize.body,
    marginTop: 5,
    textAlign: "center",
  },
});
