import { ThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { useContext } from 'react'
import { StyleSheet,Text, View  } from 'react-native'

import { InfoIcon } from './Icons'

export default function KeysetHint() {
	const { color } = useContext(ThemeContext)
	return (
		<View style={styles.keysetHintWrap}>
			<InfoIcon width={20} height={20} color={color.TEXT_SECONDARY} />
			<Text style={[styles.keysetHint, { color: color.TEXT_SECONDARY }]}>
				Latest keyset ID&apos;s are highlighted in <Text style={{ color: mainColors.VALID }}>green</Text>
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	keysetHintWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	keysetHint: {
		fontSize: 16,
		marginLeft: 10,
	}
})