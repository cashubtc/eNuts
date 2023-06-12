import { ThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { useContext } from 'react'
import { StyleSheet,Text, View  } from 'react-native'

export default function KeysetHint() {
	const { color } = useContext(ThemeContext)
	return (
		<View style={styles.keysetHintWrap}>
			<Text style={[styles.keysetHint, { color: color.TEXT_SECONDARY }]}>
				Latest keyset ID&apos;s are <Text style={{ color: mainColors.VALID }}>green</Text>
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	keysetHintWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	keysetHint: {
		fontSize: 16,
	}
})