import { SettingsIcon } from "@comps/Icons";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi, mainColors } from "@styles";
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
  // Use white color for better visibility against highlight backgrounds
  const iconColor = mainColors.WHITE;

  // Logo source logic (same as Logo component)
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
          backgroundColor: hi[highlight],
        },
      ]}
    >
      <View style={styles.topBarContent}>
        {/* Logo - absolutely centered */}
        <View style={styles.logoCenterContainer}>
          <TouchableOpacity onPress={() => void handleLogoPress()} style={styles.logoBtn}>
            <Image source={logoSrc} style={styles.logoImage} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Settings button - positioned on the right */}
        <TouchableOpacity onPress={onSettingsPress} style={styles.settingsBtn}>
          <SettingsIcon width={s(24)} height={s(24)} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  topBar: {
    paddingHorizontal: "20@s",
    paddingBottom: "10@vs",
  },
  topBarContent: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: "56@s",
  },
  logoCenterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBtn: {
    padding: "8@s",
  },
  logoImage: {
    width: "40@s",
    height: "40@s",
  },
  settingsBtn: {
    padding: "8@s",
    zIndex: 1,
  },
});
