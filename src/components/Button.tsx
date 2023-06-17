import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native'

interface IButtonProps {
	txt: string
	border?: boolean
	outlined?: boolean
	filled?: boolean
	disabled?: boolean
	onPress: () => void
}

export default function Button({ txt, border, outlined, filled, disabled, onPress }: IButtonProps) {
	const { highlight } = useContext(ThemeContext)
	return (
		<SafeAreaView style={styles.safeArea}>
			<TouchableOpacity
				accessibilityRole='button'
				activeOpacity={.5}
				disabled={disabled}
				style={[
					styles.touchableOpacity,
					{ backgroundColor: hi[highlight] },
					border ? { borderWidth: 1, borderColor: '#FAFAFA' } : {},
					filled ? { backgroundColor: '#FAFAFA' } : {},
					outlined ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: hi[highlight] } : {}
				]}
				onPress={onPress}
			>
				<Text style={[styles.btnTxt, filled || outlined ? { color: hi[highlight] } : {}]}>
					{txt}
				</Text>
			</TouchableOpacity>
		</SafeAreaView>
	)
}

interface IIconBtnProps {
	icon: React.ReactNode
	onPress: () => void
	testId?: string
}

export function IconBtn({ icon, onPress, testId }: IIconBtnProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<SafeAreaView>
			<TouchableOpacity
				accessibilityRole='button'
				activeOpacity={.5}
				style={[styles.iconBtn, { backgroundColor: color.BACKGROUND, borderColor: hi[highlight] }]}
				onPress={onPress}
				testID={testId}
			>
				{icon}
			</TouchableOpacity>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		width: '100%'
	},
	touchableOpacity: {
		padding: 20,
		borderRadius: 50
	},
	btnTxt: {
		color: '#FAFAFA',
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500'
	},
	// icon button
	iconBtn: {
		padding: 20,
		borderWidth: 1,
		borderRadius: 50,
	}
})