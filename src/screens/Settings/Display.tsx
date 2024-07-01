import RadioBtn from '@comps/RadioBtn'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import type { TDisplaySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, HighlightKey, themeColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

export default function DisplaySettings({ navigation, route }: TDisplaySettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { setTheme, theme, color, highlight } = useThemeContext()
	return (
		<Screen
			screenName={t('display', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView style={{ marginBottom: vs(60) }} alwaysBounceVertical={false}>
				<Txt
					txt='Theme'
					bold
					styles={[styles.subHeader]}
				/>
				<View style={globals(color).wrapContainer}>
					<View style={[globals().wrapRow]}>
						<Txt txt={t('darkMode')} />
						<Toggle value={theme === 'Dark'} onChange={() => setTheme(theme === 'Light' ? 'Dark' : 'Light')} />
					</View>
				</View>
				<Txt
					txt='Highlight'
					bold
					styles={[styles.subHeader]}
				/>
				<View style={globals(color).wrapContainer}>
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
	name: HighlightKey
	selected: boolean
	hasSeparator?: boolean
}

function ThemeSelection({ name, selected, hasSeparator }: IThemeSelectionProps) {
	const { t } = useTranslation([NS.common])
	const { setHighlight } = useThemeContext()
	return (
		<>
			<TouchableOpacity style={[globals().wrapRow, { paddingBottom: vs(15) }]}
				onPress={() => setHighlight(name)}
			>
				<Txt txt={name === 'Default' ? t('default') : name} />
				<RadioBtn selected={selected} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginBottom: vs(15) }]} />}
		</>
	)
}

const styles = ScaledSheet.create({
	subHeader: {
		paddingHorizontal: '20@s',
		marginBottom: '10@vs',
	},
})