import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
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
  const { color } = useThemeContext();
  const { formatAmount } = useCurrencyContext();

  const { formatted, symbol } = formatAmount(amount);
  const amountDisplay = `${amountPrefix}${formatted} ${symbol}`;

  return (
    <View style={styles.overview}>
      <Txt txt={amountDisplay} styles={[styles.amount, { color: amountColor }]} />
      <Txt txt={typeLabel} styles={[styles.type, { color: color.TEXT_SECONDARY }]} />
      <Txt txt={description} styles={[styles.description, { color: color.TEXT_SECONDARY }]} />
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
