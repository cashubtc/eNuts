import RadioBtn from '@comps/RadioBtn'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ILangsOpt, TranslationLangCodes, TTlLangNames } from '@model/i18n'
import type { TLanguageSettingsPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { vs } from 'react-native-size-matters'

const langs: ILangsOpt[] = [
	{ name: 'english', code: 'en' },
	{ name: 'german', code: 'de' },
	{ name: 'french', code: 'fr' },
	{ name: 'swahili', code: 'sw' },
	{ name: 'spanish', code: 'es' },
	{ name: 'hungarian', code: 'hu' },
]

export default function LanguageSettings({ navigation }: TLanguageSettingsPageProps) {
	const { t, i18n } = useTranslation([NS.common])
	const { color } = useThemeContext()
	return (
		<Screen
			screenName={t('language', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					{langs.map((l, i) => (
						<LangSelection key={l.code} code={l.code} name={l.name} selected={l.code === i18n.language} hasSeparator={i !== langs.length - 1} />
					))}
				</View>
			</ScrollView>
		</Screen>
	)
}

interface ILangSelectionProps {
	code: TranslationLangCodes
	name: TTlLangNames
	selected: boolean
	hasSeparator?: boolean
}

function LangSelection({ code, name, selected, hasSeparator }: ILangSelectionProps) {
	const { t, i18n } = useTranslation([NS.common])
	const handleLangChange = async () => {
		await i18n.changeLanguage(code)
		await store.set(STORE_KEYS.lang, code)
	}
	return (
		<>
			<TouchableOpacity style={[globals().wrapRow, { paddingBottom: vs(15) }]}
				onPress={() => void handleLangChange()}
			>
				<Txt txt={t(name)} />
				<RadioBtn selected={selected} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginBottom: vs(15) }]} />}
		</>
	)
}
