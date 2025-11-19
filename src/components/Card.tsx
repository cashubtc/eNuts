import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import type { ReactNode } from 'react'
import { View, type ViewStyle, type StyleProp } from 'react-native'
import { ScaledSheet, s, vs } from 'react-native-size-matters'

interface ICardProps {
	children: ReactNode
	variant?: 'base' | 'accent'
	style?: StyleProp<ViewStyle>
}

export default function Card({ children, variant = 'base', style }: ICardProps) {
	const { color, highlight } = useThemeContext()

	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: color.DRAWER,
					borderColor: variant === 'accent' ? hi[highlight] : color.BORDER,
				},
				style
			]}
		>
			{children}
		</View>
	)
}

const styles = ScaledSheet.create({
	card: {
		borderRadius: 20,
		borderWidth: 2,
		padding: '20@s',
	},
})

