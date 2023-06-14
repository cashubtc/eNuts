import Separator from '@comps/Separator'
import type { TDisplaySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, themeColors } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

export default function DisplaySettings({ navigation, route }: TDisplaySettingsPageProps) {
	const { setTheme, theme, color, highlight } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName='Display'
				withBackBtn
				backHandler={() => navigation.navigate('Settings')}
			/>
			<ScrollView style={{ width: '100%', marginBottom: 60 }} showsVerticalScrollIndicator={false}>
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					Theme
				</Text>
				<View style={[styles.wrap, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
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
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					Highlight
				</Text>
				<View style={[styles.highlightWrap, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
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
	const { color, highlight, setHighlight } = useContext(ThemeContext)
	return (
		<>
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
			{hasSeparator && <Separator style={[{ marginHorizontal: 20, marginVertical: 10 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 120,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	highlightWrap: {
		paddingVertical: 10,
		borderWidth: 1,
		borderRadius: 20,
		marginBottom: 20,
	},
	wrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		padding: 10,
	}
})