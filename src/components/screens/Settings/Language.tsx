import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const langs = [
	{ name: 'english', code: 'en' },
	{ name: 'german', code: 'de' },
]

export default function LanguageSettings() {
	const { i18n } = useTranslation()
	l({ nextLang: i18n.language })
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName='Language' withBackBtn />
			<View style={[globals(color).wrapContainer, styles.highlightWrap]}>
				{langs.map((l, i) => (
					<LangSelection key={l.code} code={l.code} name={l.name} selected={l.code === i18n.language} hasSeparator={i !== langs.length - 1} />
				))}
			</View>
		</View>
	)
}

interface ILangSelectionProps {
	code: string
	name: string
	selected: boolean
	hasSeparator?: boolean
}

function LangSelection({ code, name, selected, hasSeparator }: ILangSelectionProps) {
	const { t, i18n } = useTranslation()
	const { color, highlight } = useContext(ThemeContext)
	return (
		<>
			<TouchableOpacity style={styles.langRow}
				onPress={() => void i18n.changeLanguage(code)}
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
	container: {
		flex: 1,
		paddingTop: 110,
	},
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