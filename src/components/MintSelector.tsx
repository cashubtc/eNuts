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
import { Image } from "expo-image";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { ChevronRightIcon } from "./Icons";
import Txt from "./Txt";
import Card from "./Card";

interface IMintSelectorProps {
  mint: KnownMintWithBalance;
  onPress: (mint: KnownMintWithBalance) => void;
  variant?: "base" | "accent";
  style?: StyleProp<ViewStyle>;
}

export default function MintSelector({
  mint,
  onPress,
  variant = "base",
  style,
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
        <View style={styles.container}>
          {/* Left side: Mint icon (if available) */}
          {mint.mintInfo.icon_url && (
            <View style={styles.iconContainer}>
              <Image
                source={{ uri: mint.mintInfo.icon_url }}
                style={styles.icon}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}

          {/* Center: Mint name and balance */}
          <View style={styles.infoContainer}>
            <Txt txt={displayName} bold styles={[{ color: color.TEXT }]} />
            <Txt
              txt={displayBalance}
              styles={[
                {
                  color: color.TEXT_SECONDARY,
                  fontSize: s(12),
                  marginTop: vs(2),
                },
              ]}
            />
          </View>

          {/* Right side: Chevron icon */}
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
  },
  iconContainer: {
    marginRight: "12@s",
  },
  icon: {
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  chevronContainer: {
    marginLeft: "8@s",
  },
});
