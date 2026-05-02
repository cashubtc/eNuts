import { useAppThemeTokens } from "@styles";
import Txt from "@comps/Txt";
import { useCurrencyContext } from "@src/context/Currency";
import { View, StyleSheet } from "react-native";

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
    <View style={styles.overview}>
      <Txt txt={amountDisplay} styles={[styles.amount, { color: amountColor }]} />
      <Txt txt={typeLabel} styles={[styles.type, { color: theme.textSecondary }]} />
      <Txt txt={description} styles={[styles.description, { color: theme.textSecondary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overview: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  amount: {
    fontSize: 40,
    fontWeight: "600",
  },
  type: {
    fontSize: 14,
    marginTop: 5,
  },
  description: {
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});
