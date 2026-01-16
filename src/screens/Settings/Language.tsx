import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { ILangsOpt, TranslationLangCodes, TTlLangNames } from "@model/i18n";
import type { TLanguageSettingsPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { getFlagEmoji } from "@src/util";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { globals } from "@styles";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { s, vs } from "react-native-size-matters";

const langs: ILangsOpt[] = [
  { name: "english", code: "en", flag: "us" },
  { name: "german", code: "de", flag: "de" },
  { name: "spanish", code: "es", flag: "es" },
  { name: "italian", code: "it", flag: "it" },
  { name: "russian", code: "ru", flag: "ru" },
  { name: "thai", code: "th", flag: "th" },
];

export default function LanguageSettings({ navigation }: TLanguageSettingsPageProps) {
  const { t, i18n } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  return (
    <Screen
      screenName={t("language", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView alwaysBounceVertical={false}>
        <View style={globals(color).wrapContainer}>
          {langs.map((l, i) => (
            <LangSelection
              key={l.code}
              code={l.code}
              name={l.name}
              flag={l.flag}
              selected={l.code === i18n.language}
              hasSeparator={i !== langs.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

interface ILangSelectionProps {
  code: TranslationLangCodes;
  name: TTlLangNames;
  flag: string;
  selected: boolean;
  hasSeparator?: boolean;
}

function LangSelection({ code, name, flag, selected, hasSeparator }: ILangSelectionProps) {
  const { t, i18n } = useTranslation([NS.common]);
  const handleLangChange = async () => {
    await i18n.changeLanguage(code);
    await store.set(STORE_KEYS.lang, code);
  };
  return (
    <>
      <TouchableOpacity
        style={[globals().wrapRow, { paddingBottom: vs(15) }]}
        onPress={() => void handleLangChange()}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ minWidth: s(40) }}>
            <Txt txt={getFlagEmoji(flag)} styles={[{ fontSize: s(22) }]} />
          </View>
          <Txt txt={t(name)} />
        </View>
        <RadioBtn selected={selected} />
      </TouchableOpacity>
      {hasSeparator && <Separator style={[{ marginBottom: vs(15) }]} />}
    </>
  );
}
