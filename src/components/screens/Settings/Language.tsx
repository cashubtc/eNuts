import Container from '@comps/Container'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ILangsOpt, TranslationLangCodes, TTlLangNames } from '@model/i18n'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const langs: ILangsOpt[] = [
	{ name: 'english', code: 'en' },
	{ name: 'german', code: 'de' },
	{ name: 'french', code: 'fr' },
]

export default function LanguageSettings() {
	const { t, i18n } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<Container>
			<TopNav screenName={t('language', { ns: 'topNav' })} withBackBtn />
			<View style={[globals(color).wrapContainer, styles.highlightWrap]}>
				{langs.map((l, i) => (
					<LangSelection key={l.code} code={l.code} name={l.name} selected={l.code === i18n.language} hasSeparator={i !== langs.length - 1} />
				))}
			</View>
		</Container>
	)
}

interface ILangSelectionProps {
	code: TranslationLangCodes
	name: TTlLangNames
	selected: boolean
	hasSeparator?: boolean
}

function LangSelection({ code, name, selected, hasSeparator }: ILangSelectionProps) {
	const { t, i18n } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const handleLangChange = async () => {
		await i18n.changeLanguage(code)
		await store.set('settings_lang', code)
	}
	return (
		<>
			<TouchableOpacity style={styles.langRow}
				onPress={() => void handleLangChange()}
			>
				<Txt txt={t(name)} />
				<View
					style={[
						globals(color, highlight).radioBtn,
						{ backgroundColor: selected ? hi[highlight] : 'transparent' }
					]}
				/>
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginHorizontal: 20, marginVertical: 10 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	highlightWrap: {
		paddingHorizontal: 0,
		paddingVertical: 10,
		marginBottom: 20,
	},
	langRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
})