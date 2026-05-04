import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import type { TDisplaySettingsPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import {
  AppText,
  globals,
  PressableSurface,
  themeColors,
  useAppThemeTokens,
  type HighlightKey,
  Stack,
} from "@styles";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
const themeModes = ["dark", "light", "auto"] as const;
export default function DisplaySettings({ navigation }: TDisplaySettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { updateMode, mode, highlight } = useThemeContext();
  const theme = useAppThemeTokens();
  return (
    <Screen
      screenName={t("display", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView alwaysBounceVertical={false}>
        <AppText style={[styles.subHeader]} weight="medium" testID={"Theme-txt"}>
          Theme
        </AppText>
        <Stack style={[globals().wrapContainer, { backgroundColor: theme.drawer }]}>
          {themeModes.map((themeMode, i) => (
            <RadioSelection
              key={themeMode}
              label={t(`${themeMode}Mode`)}
              selected={mode === themeMode}
              hasSeparator={i !== themeModes.length - 1}
              onPress={() => updateMode(themeMode)}
            />
          ))}
        </Stack>
        <AppText style={[styles.subHeader]} weight="medium" testID={"Highlight-txt"}>
          Highlight
        </AppText>
        <Stack
          style={[globals().wrapContainer, { backgroundColor: theme.drawer }, { marginBottom: 80 }]}
        >
          {themeColors.map((t, i) => (
            <ThemeSelection
              key={t}
              name={t}
              selected={t === highlight}
              hasSeparator={i !== themeColors.length - 1}
            />
          ))}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
interface IThemeSelectionProps {
  name: HighlightKey;
  selected: boolean;
  hasSeparator?: boolean;
}
function ThemeSelection({ name, selected, hasSeparator }: IThemeSelectionProps) {
  const { t } = useTranslation([NS.common]);
  const { updateHighlight } = useThemeContext();
  return (
    <RadioSelection
      label={name === "Default" ? t("default") : name}
      selected={selected}
      hasSeparator={hasSeparator}
      onPress={() => updateHighlight(name)}
    />
  );
}
interface IRadioSelectionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  hasSeparator?: boolean;
}
function RadioSelection({ label, selected, onPress, hasSeparator }: IRadioSelectionProps) {
  return (
    <>
      <PressableSurface
        accessibilityRole="button"
        style={[globals().wrapRow, styles.radioRow]}
        onPress={onPress}
      >
        <AppText testID={`${label}-txt`}>{label}</AppText>
        <RadioBtn selected={selected} />
      </PressableSurface>
      {hasSeparator && <Separator style={styles.radioSeparator} />}
    </>
  );
}
const styles = StyleSheet.create({
  radioRow: {
    paddingBottom: 15,
  },
  radioSeparator: {
    marginBottom: 15,
  },
  subHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});
