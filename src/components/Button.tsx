import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { SafeAreaView, type StyleProp, StyleSheet, Text, type TextStyle, TouchableOpacity } from 'react-native'

import Loading from './Loading'
import Txt from './Txt'

interface IButtonProps {
	txt: string
	onPress: () => void
	border?: boolean
	outlined?: boolean
	filled?: boolean
	disabled?: boolean
	loading?: boolean
	icon?: React.ReactNode
}

export default function Button({ txt, onPress, border, outlined, filled, disabled, loading, icon }: IButtonProps) {
	const { color, highlight } = useThemeContext()
	return (
		<SafeAreaView style={styles.safeArea}>
			<TouchableOpacity
				accessibilityRole='button'
				activeOpacity={.5}
				disabled={disabled}
				style={[
					styles.touchableOpacity,
					{ backgroundColor: hi[highlight], padding: 20 },
					border ? { borderWidth: 1, borderColor: mainColors.WHITE } : {},
					filled ? { backgroundColor: mainColors.WHITE } : {},
					outlined ? { backgroundColor: 'transparent', padding: 18, borderWidth: 1, borderColor: hi[highlight] } : {},
					disabled ? { opacity: .3 } : {}
				]}
				onPress={onPress}
			>
				<Text style={[
					styles.btnTxt,
					{ color: getColor(highlight, color) },
					filled || outlined ? { color: hi[highlight] } : {},
					loading || icon ? { marginRight: 10 } : {}
				]}>
					{txt}
				</Text>
				{loading && <Loading color={getColor(highlight, color)} />}
				{!loading ? icon : null}
			</TouchableOpacity>
		</SafeAreaView>
	)
}

interface IIconBtnProps {
	icon: React.ReactNode
	onPress: () => void
	outlined?: boolean
	disabled?: boolean
	size?: number
	testId?: string
}

export function IconBtn({ icon, size, outlined, disabled, onPress, testId }: IIconBtnProps) {
	const { color, highlight } = useThemeContext()
	return (
		<SafeAreaView>
			<TouchableOpacity
				accessibilityRole='button'
				activeOpacity={.5}
				style={[
					styles.iconBtn,
					{
						width: size || 60,
						height: size || 60,
						borderRadius: (size || 60) / 2,
						backgroundColor: outlined ? color.BACKGROUND : hi[highlight],
						borderColor: hi[highlight],
						// opacity: disabled ? .6 : 1
					}]}
				onPress={onPress}
				disabled={disabled}
				testID={testId}
			>
				{icon}
			</TouchableOpacity>
		</SafeAreaView>
	)
}

interface ITxtBtnProps {
	txt: string
	onPress: () => void
	icon?: React.ReactNode
	disabled?: boolean
	style?: StyleProp<TextStyle>[]
	txtColor?: string
}

export function TxtButton({ txt, onPress, icon, disabled, style, txtColor }: ITxtBtnProps) {
	const { color, highlight } = useThemeContext()
	return (
		<TouchableOpacity
			style={[styles.copyTxt, ...(style || [])]}
			onPress={onPress}
			disabled={disabled}
		>
			<Txt
				txt={txt}
				styles={[globals(color).pressTxt, { color: txtColor || hi[highlight], marginRight: icon ? 10 : 0 }]}
			/>
			{icon ? icon : null}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		width: '100%'
	},
	touchableOpacity: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 50,
	},
	btnTxt: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500'
	},
	// icon button
	iconBtn: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	// txt button
	copyTxt: {
		paddingTop: 30,
		paddingBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	}
})