import { useThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function PinDots({ input, mismatch }: { input: number[], mismatch?: boolean }) {
	const { color, highlight } = useThemeContext()
	return (
		<View style={[styles.pinWrap, { width: s(25) * input.length }]}>
			{input.map((_n, i) => <View key={i} style={[styles.pinCircle, { backgroundColor: mismatch ? mainColors.ERROR : getColor(highlight, color) }]} />)}
		</View>
	)
}

const styles = ScaledSheet.create({
	pinWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		marginVertical: '40@vs',
	},
	pinCircle: {
		width: '10@s',
		height: '10@s',
		borderRadius: '5@s',
	},
})