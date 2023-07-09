import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'

export default function PinDots({ input, mismatch }: { input: number[], mismatch?: boolean }) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.pinWrap, { width: 25 * input.length }]}>
			{input.map((_n, i) => <View key={i} style={[styles.pinCircle, { backgroundColor: mismatch ? color.ERROR : '#FAFAFA' }]} />)}
		</View>
	)
}

const styles = StyleSheet.create({
	pinWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		marginVertical: 40
	},
	pinCircle: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
})