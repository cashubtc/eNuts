import { useThemeContext } from "@src/context/Theme";
import { usePrivacyContext } from "@src/context/Privacy";
import { formatMintUrl, formatSatStr } from "@util";
import {
  TouchableOpacity,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
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

  const displayName = mint.mintInfo.name || formatMintUrl(mint.mintUrl);
  const displayBalance = hidden.balance
    ? "****"
    : formatSatStr(mint.balance, "compact");

  return (
    <TouchableOpacity
      onPress={() => onPress(mint)}
      activeOpacity={0.7}
      style={style}
    >
      <Card variant={variant} style={styles.cardContent}>
        {label && (
          <Txt
            txt={label}
            styles={[
              {
                color: color.TEXT_SECONDARY,
                fontSize: s(12),
                marginBottom: vs(8),
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
                  fontSize: s(12),
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

const styles = ScaledSheet.create({
  cardContent: {
    padding: "12@s",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: "8@s",
  },
  infoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevronContainer: {
    marginLeft: "8@s",
  },
});
