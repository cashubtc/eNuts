import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { formatSatStr } from '@util'
import { View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import { MintBoardIcon } from './Icons'
import Txt from './Txt'

interface IMintBalanceProps {
	balance: number
	txtColor: string
	disabled?: boolean
}

export default function MintBalance({ balance, txtColor, disabled }: IMintBalanceProps) {
	const { color, highlight } = useThemeContext()
	const { hidden } = usePrivacyContext()
	return (
		<View style={[styles.wrap, { borderColor: disabled ? color.TEXT_SECONDARY : hi[highlight] }]}>
			<MintBoardIcon width={s(16)} height={s(16)} color={disabled ? color.TEXT_SECONDARY : hi[highlight]} />
			<Txt txt={hidden.balance ? '****' : formatSatStr(balance)} styles={[{ fontSize: vs(10), color: txtColor, marginLeft: s(5) }]} />
		</View>
	)
}

const styles = ScaledSheet.create({
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		paddingVertical: '4@vs',
		paddingHorizontal: '6@s',
		borderRadius: 20,
	},
})