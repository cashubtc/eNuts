import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { formatSatStr } from '@util'
import { StyleSheet, View } from 'react-native'

import { MintBoardIcon } from './Icons'
import Txt from './Txt'

interface IMintBalanceProps {
	balance: string
	txtColor: string
	disabled?: boolean
}

export default function MintBalance({ balance, txtColor, disabled }: IMintBalanceProps) {
	const { color, highlight } = useThemeContext()
	return (
		<View style={[styles.wrap, { borderColor: disabled ? color.TEXT_SECONDARY : hi[highlight] }]}>
			<MintBoardIcon width={18} height={20} color={disabled ? color.TEXT_SECONDARY : hi[highlight]} />
			<Txt txt={formatSatStr(+balance)} styles={[{ fontSize: 12, color: txtColor, marginLeft: 5 }]} />
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