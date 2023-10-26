import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { StyleSheet, View } from 'react-native'

import { MintBoardIcon } from './Icons'
import Txt from './Txt'

export default function MintBalance({ balance, txtColor }: { balance: string, txtColor: string }) {
	const { highlight } = useThemeContext()
	return (
		<View style={[styles.wrap, { borderColor: hi[highlight] }]}>
			<MintBoardIcon width={18} height={20} color={hi[highlight]} />
			<Txt txt={`${balance} Sat`} styles={[{ fontSize: 12, color: txtColor, marginLeft: 5 }]} />
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		paddingVertical: 4,
		paddingHorizontal: 6,
		borderRadius: 20,
	},
})