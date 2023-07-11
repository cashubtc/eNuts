import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Button from './Button'

interface IActionBtnsProps {
	topBtnTxt: string
	topBtnAction: () => void
	bottomBtnTxt: string
	bottomBtnAction: () => void
	ontopOfNav?: boolean
	absolutePos?: boolean
	loading?: boolean
	withHistory?: boolean
	nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
}

export default function ActionButtons({
	topBtnTxt,
	topBtnAction,
	bottomBtnTxt,
	bottomBtnAction,
	ontopOfNav,
	absolutePos,
	loading,
	withHistory,
	nav
}: IActionBtnsProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { t } = useTranslation()
	return (
		<View
			style={[
				styles.actionWrap,
				ontopOfNav ? styles.ontopOfNav : {},
				absolutePos ? styles.absolute : {},
			]}
		>
			{withHistory &&
				<TouchableOpacity
					style={styles.historyBtn}
					onPress={() => nav?.navigate('history')}
				>
					<Text style={globals(color, highlight).pressTxt}>
						{t('topNav.history')}
					</Text>
				</TouchableOpacity>
			}
			<Button
				loading={loading}
				txt={topBtnTxt}
				onPress={topBtnAction}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={bottomBtnTxt}
				outlined
				onPress={bottomBtnAction}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	actionWrap: {
		width: '100%',
	},
	ontopOfNav: {
		paddingLeft: 20,
		paddingRight: 20,
		marginBottom: 75,
	},
	absolute: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		left: 0,
		padding: 20,
	},
	historyBtn: {
		padding: 30,
	}
})