import type { TDisplaySettingsPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, themeColors } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'

export default function DisplaySettings({ navigation }: TDisplaySettingsPageProps) {
	const { setTheme, theme, color, highlight } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName='Display'
				withBackBtn
				backHandler={() => navigation.navigate('Settings')}
			/>
			<View style={styles.settingsRow}>
				<Text style={globals(color).txt}>
					Dark mode
				</Text>
				<Switch
					trackColor={{ false: color.INPUT_BG, true: hi[highlight] }}
					thumbColor={color.TEXT}
					onValueChange={() => setTheme(theme === 'Light' ? 'Dark' : 'Light')}
					value={theme === 'Dark'}
				/>
			</View>
			<View style={[styles.separator, { borderBottomColor: color.BORDER }]} />
			<Text style={[styles.subHeader, { marginBottom: 20, color: color.TEXT }]}>
				Theme
			</Text>
			{themeColors.map(t => (
				<ThemeSelection key={t} name={t} selected={t === highlight} />
			))}
			<View style={[styles.separator, { marginTop: 10, borderBottomColor: color.BORDER }]} />
		</View>
	)
}

interface IThemeSelectionProps {
	name: string
	selected: boolean
}

function ThemeSelection({ name, selected }: IThemeSelectionProps) {
	const { color, highlight, setHighlight } = useContext(ThemeContext)
	return (
		<TouchableOpacity style={styles.settingsRow}
			onPress={() => setHighlight(name)}
		>
			<Text style={globals(color).txt}>
				{name}
			</Text>
			<View
				style={[
					styles.radioBtn,
					{ borderColor: color.BORDER, backgroundColor: selected ? hi[highlight] : 'transparent' }
				]}
			/>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 130,
		paddingHorizontal: 20,
	},
	subHeader: {
		fontSize: 18,
		fontWeight: '500',
		marginBottom: 10,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	separator: {
		borderBottomWidth: 1,
		marginBottom: 25,
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		padding: 10,
	}
})