import { usePrivacyContext } from "@src/context/Privacy";
import { useCurrencyContext } from "@src/context/Currency";
import { AppText, fontScale, useAppThemeTokens } from "@styles";
import { formatMintUrl } from "@util";
import { TouchableOpacity, View, type ViewStyle, type StyleProp, StyleSheet } from "react-native";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { ChevronRightIcon } from "./Icons";
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
  const { hidden } = usePrivacyContext();
  const { formatAmount } = useCurrencyContext();
  const theme = useAppThemeTokens();
  const displayName = mint.mintInfo.name || formatMintUrl(mint.mintUrl);
  const { formatted, symbol } = formatAmount(mint.balance);
  const displayBalance = hidden.balance ? "****" : `${formatted} ${symbol}`;
  return (
    <TouchableOpacity onPress={() => onPress(mint)} activeOpacity={0.7} style={style}>
      <Card variant={variant} style={styles.cardContent}>
        {label && (
          <AppText
            style={[
              {
                color: theme.textSecondary,
                fontSize: fontScale(12),
                marginBottom: 8,
              },
            ]}
            testID={`${label}-txt`}
          >
            {label}
          </AppText>
        )}
        <View style={styles.container}>
          {/* Mint name and balance container */}
          <View style={styles.infoContainer}>
            <AppText style={[{ color: theme.text }]} weight="medium" testID={`${displayName}-txt`}>
              {displayName}
            </AppText>
            <AppText
              style={[
                {
                  color: theme.textSecondary,
                  fontSize: fontScale(12),
                },
              ]}
              testID={`${displayBalance}-txt`}
            >
              {displayBalance}
            </AppText>
          </View>

          {/* Chevron icon */}
          <View style={styles.chevronContainer}>
            <ChevronRightIcon color={theme.text} />
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
