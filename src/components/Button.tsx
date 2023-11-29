import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { SafeAreaView, type StyleProp, type TextStyle, TouchableOpacity } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

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
					{ backgroundColor: hi[highlight], paddingHorizontal: vs(18), paddingVertical: vs(18) },
					border ? { borderWidth: 1, borderColor: mainColors.WHITE } : {},
					filled ? { backgroundColor: mainColors.WHITE } : {},
					outlined ? { backgroundColor: 'transparent', paddingHorizontal: vs(18), paddingVertical: vs(18), borderWidth: 1, borderColor: hi[highlight] } : {},
					disabled ? { opacity: .3 } : {}
				]}
				onPress={onPress}
			>
				<Txt
					txt={txt}
					bold
					center
					styles={[
						{ color: getColor(highlight, color) },
						filled || outlined ? { color: hi[highlight] } : {},
						loading || icon ? { marginRight: s(10) } : {}
					]}
				/>
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
						width: size || s(60),
						height: size || s(60),
						borderRadius: (size || s(60)) / 2,
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
				styles={[globals(color).pressTxt, { color: txtColor || hi[highlight], marginRight: icon ? s(10) : 0 }]}
			/>
			{icon ? icon : null}
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
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
	// icon button
	iconBtn: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	// txt button
	copyTxt: {
		paddingTop: '30@vs',
		paddingBottom: '10@vs',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	}
})