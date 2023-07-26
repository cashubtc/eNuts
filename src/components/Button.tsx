import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native'

import Loading from './Loading'

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
	const { highlight } = useContext(ThemeContext)
	return (
		<SafeAreaView style={styles.safeArea}>
			<TouchableOpacity
				accessibilityRole='button'
				activeOpacity={.5}
				disabled={disabled}
				style={[
					styles.touchableOpacity,
					{ backgroundColor: hi[highlight], padding: 20 },
					border ? { borderWidth: 1, borderColor: '#FAFAFA' } : {},
					filled ? { backgroundColor: '#FAFAFA' } : {},
					outlined ? { backgroundColor: 'transparent', padding: 18, borderWidth: 1, borderColor: hi[highlight] } : {},
					disabled ? { opacity: .3 } : {}
				]}
				onPress={onPress}
			>
				<Text style={[
					styles.btnTxt,
					filled || outlined ? { color: hi[highlight] } : {},
					loading || icon ? { marginRight: 10 } : {}
				]}>
					{txt}
				</Text>
				{loading && <Loading color='#FAFAFA' />}
				{!loading ? icon : null}
			</TouchableOpacity>
		</SafeAreaView>
	)
}

interface IIconBtnProps {
	icon: React.ReactNode
	onPress: () => void
	outlined?: boolean
	size?: number
	testId?: string
}

export function IconBtn({ icon, size, outlined, onPress, testId }: IIconBtnProps) {
	const { color, highlight } = useContext(ThemeContext)
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
						borderColor: hi[highlight]
					}]}
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
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 50,
	},
	btnTxt: {
		color: '#FAFAFA',
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500'
	},
	// icon button
	iconBtn: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	}
})