import { SettingsIcon } from "@comps/Icons";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";
import { Image, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

interface IDashboardTopBarProps {
  onSettingsPress: () => void;
}

export default function DashboardTopBar({ onSettingsPress }: IDashboardTopBarProps) {
  const { color, highlight, activeTheme } = useThemeContext();
  const { handleLogoPress } = usePrivacyContext();
  const insets = useSafeAreaInsets();
  const iconColor = hi[highlight];

  const logoSrc =
    activeTheme === "dark" && (highlight === "Zap" || highlight === "Azyre" || highlight === "Rosy")
      ? require("@assets/icon_transparent_dark.png")
      : require("@assets/icon_transparent.png");

  return (
    <View
      style={[
        styles.topBar,
        {
          paddingTop: insets.top,
          backgroundColor: color.BACKGROUND,
        },
      ]}
    >
      <View style={styles.topBarContent}>
        <TouchableOpacity onPress={() => void handleLogoPress()} style={styles.controlBtn}>
          <View style={[styles.logoMark, { backgroundColor: hi[highlight] }]}>
            <Image source={logoSrc} style={styles.logoImage} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettingsPress} style={styles.controlBtn}>
          <SettingsIcon width={s(24)} height={s(24)} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  topBar: {
    paddingHorizontal: "20@s",
    paddingBottom: "4@vs",
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "50@s",
  },
  controlBtn: {
    width: "48@s",
    height: "48@s",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    width: "36@s",
    height: "36@s",
    borderRadius: "18@s",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "27@s",
    height: "27@s",
  },
});
