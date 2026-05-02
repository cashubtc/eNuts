import { SettingsIcon } from "@comps/Icons";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { Stack, highlight as hi } from "@styles";
import { Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    <Stack
      paddingHorizontal={20}
      paddingBottom={4}
      style={{ paddingTop: insets.top, backgroundColor: color.BACKGROUND }}
    >
      <Stack flexDirection="row" alignItems="center" justifyContent="space-between" minHeight={50}>
        <TouchableOpacity
          onPress={() => void handleLogoPress()}
          style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
        >
          <Stack
            width={36}
            height={36}
            borderRadius={18}
            alignItems="center"
            justifyContent="center"
            style={{ backgroundColor: hi[highlight] }}
          >
            <Image source={logoSrc} style={{ width: 27, height: 27 }} resizeMode="contain" />
          </Stack>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSettingsPress}
          style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
        >
          <SettingsIcon width={24} height={24} color={iconColor} />
        </TouchableOpacity>
      </Stack>
    </Stack>
  );
}
