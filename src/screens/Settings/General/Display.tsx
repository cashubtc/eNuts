import RadioBtn from '@comps/RadioBtn'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TDisplaySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, themeColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DisplaySettings({ navigation, route }: TDisplaySettingsPageProps) {
	const { t } = useTranslation(['common'])
	const insets = useSafeAreaInsets()
	const { setTheme, theme, color, highlight } = useThemeContext()
	return (
		<Screen
			screenName={t('display', { ns: 'topNav' })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView style={{ width: '100%', marginBottom: 60 + insets.bottom }} showsVerticalScrollIndicator={false}>
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					Theme
				</Text>
				<View style={[globals(color).wrapContainer, styles.wrap, { paddingVertical: isIOS ? 18 : 10 }]}>
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
		</Screen>
	)
}

interface IThemeSelectionProps {
	name: string
	selected: boolean
	hasSeparator?: boolean
}

function ThemeSelection({ name, selected, hasSeparator }: IThemeSelectionProps) {
	const { t } = useTranslation(['common'])
	const { setHighlight } = useThemeContext()
	return (
		<>
			<TouchableOpacity style={styles.settingsRow}
				onPress={() => setHighlight(name)}
			>
				<Txt txt={name === 'Default' ? t('default') : name} />
				<RadioBtn selected={selected} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = StyleSheet.create({
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
		marginBottom: 20,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	separator: {
		marginHorizontal: 20,
		marginVertical: 10
	}
})