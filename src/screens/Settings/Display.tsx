import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Toggle from "@comps/Toggle";
import Txt from "@comps/Txt";
import type { TDisplaySettingsPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, HighlightKey, themeColors } from "@styles";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function DisplaySettings({ navigation }: TDisplaySettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { updateMode, mode, color, highlight } = useThemeContext();
  return (
    <Screen
      screenName={t("display", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView alwaysBounceVertical={false}>
        <Txt txt="Theme" bold styles={[styles.subHeader]} />
        <View style={globals(color).wrapContainer}>
          <TouchableOpacity style={[globals().wrapRow]} onPress={() => updateMode("dark")}>
            <Txt txt={t("darkMode")} />
            <RadioBtn selected={mode === "dark"} />
          </TouchableOpacity>

          <TouchableOpacity style={[globals().wrapRow]} onPress={() => updateMode("light")}>
            <Txt txt={t("lightMode")} />
            <RadioBtn selected={mode === "light"} />
          </TouchableOpacity>
          <TouchableOpacity style={[globals().wrapRow]} onPress={() => updateMode("auto")}>
            <Txt txt={t("autoMode")} />
            <RadioBtn selected={mode === "auto"} />
          </TouchableOpacity>
        </View>
        <Txt txt="Highlight" bold styles={[styles.subHeader]} />
        <View style={[globals(color).wrapContainer, { marginBottom: s(80) }]}>
          {themeColors.map((t, i) => (
            <ThemeSelection
              key={t}
              name={t}
              selected={t === highlight}
              hasSeparator={i !== themeColors.length - 1}
            />
          ))}
        </View>
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
    <>
      <TouchableOpacity
        style={[globals().wrapRow, { paddingBottom: s(15) }]}
        onPress={() => updateHighlight(name)}
      >
        <Txt txt={name === "Default" ? t("default") : name} />
        <RadioBtn selected={selected} />
      </TouchableOpacity>
      {hasSeparator && <Separator style={[{ marginBottom: s(15) }]} />}
    </>
  );
}

const styles = ScaledSheet.create({
  subHeader: {
    paddingHorizontal: "20@s",
    marginBottom: "10@vs",
  },
});
