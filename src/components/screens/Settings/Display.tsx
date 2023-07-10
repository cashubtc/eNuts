import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TDisplaySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, themeColors } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'

export default function DisplaySettings({ navigation, route }: TDisplaySettingsPageProps) {
	const { t } = useTranslation(['common', 'topNav'])
	const { setTheme, theme, color, highlight } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('display', { ns: 'topNav' })} withBackBtn />
			<ScrollView style={{ width: '100%', marginBottom: 60 }} showsVerticalScrollIndicator={false}>
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					Theme
				</Text>
				<View style={[globals(color).wrapContainer, styles.wrap]}>
					<Txt txt={t('darkMode')} />
					<Switch
						trackColor={{ false: color.BORDER, true: hi[highlight] }}
						thumbColor={color.TEXT}
						onValueChange={() => setTheme(theme === 'Light' ? 'Dark' : 'Light')}
						value={theme === 'Dark'}
					/>
				</View>
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					Highlight
				</Text>
				<View style={[globals(color).wrapContainer, styles.highlightWrap]}>
					{themeColors.map((t, i) => (
						<ThemeSelection key={t} name={t} selected={t === highlight} hasSeparator={i !== themeColors.length - 1} />
					))}
				</View>
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
		</View>
	)
}

interface IThemeSelectionProps {
	name: string
	selected: boolean
	hasSeparator?: boolean
}

function ThemeSelection({ name, selected, hasSeparator }: IThemeSelectionProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight, setHighlight } = useContext(ThemeContext)
	return (
		<>
			<TouchableOpacity style={styles.settingsRow}
				onPress={() => setHighlight(name)}
			>
				<Txt txt={name === 'Default' ? t('default') : name} />
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
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	highlightWrap: {
		paddingHorizontal: 0,
		paddingVertical: 10,
		marginBottom: 20,
	},
	wrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		marginBottom: 20,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
})