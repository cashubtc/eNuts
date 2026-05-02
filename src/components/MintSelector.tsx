import { useThemeContext } from "@src/context/Theme";
import { usePrivacyContext } from "@src/context/Privacy";
import { useCurrencyContext } from "@src/context/Currency";
import { formatMintUrl } from "@util";
import { TouchableOpacity, View, type ViewStyle, type StyleProp, StyleSheet } from "react-native";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { ChevronRightIcon } from "./Icons";
import Txt from "./Txt";
import Card from "./Card";

interface IMintSelectorProps {
  mint: KnownMintWithBalance;
  onPress: (mint: KnownMintWithBalance) => void;
  variant?: "base" | "accent";
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export default function MintSelector({
  mint,
  onPress,
  variant = "base",
  style,
  label,
}: IMintSelectorProps) {
  const { color } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const { formatAmount } = useCurrencyContext();

  const displayName = mint.mintInfo.name || formatMintUrl(mint.mintUrl);

  const { formatted, symbol } = formatAmount(mint.balance);
  const displayBalance = hidden.balance ? "****" : `${formatted} ${symbol}`;

  return (
    <TouchableOpacity onPress={() => onPress(mint)} activeOpacity={0.7} style={style}>
      <Card variant={variant} style={styles.cardContent}>
        {label && (
          <Txt
            txt={label}
            styles={[
              {
                color: color.TEXT_SECONDARY,
                fontSize: 12,
                marginBottom: 8,
              },
            ]}
          />
        )}
        <View style={styles.container}>
          {/* Mint name and balance container */}
          <View style={styles.infoContainer}>
            <Txt txt={displayName} bold styles={[{ color: color.TEXT }]} />
            <Txt
              txt={displayBalance}
              styles={[
                {
                  color: color.TEXT_SECONDARY,
                  fontSize: 12,
                },
              ]}
            />
          </View>

          {/* Chevron icon */}
          <View style={styles.chevronContainer}>
            <ChevronRightIcon color={color.TEXT} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    padding: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevronContainer: {
    marginLeft: 8,
  },
});
