import MintBalance from '@comps/MintBalance'
import { useThemeContext } from '@src/context/Theme'
import { TouchableOpacity } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

interface IMintBalanceBtnProps {
	handleMintBalancePress?: () => void
	disableMintBalance?: boolean
	mintBalance: number
}

export default function MintBalanceBtn({handleMintBalancePress, disableMintBalance, mintBalance}: IMintBalanceBtnProps) {
	const { color } = useThemeContext()
	return (
		<TouchableOpacity
			style={styles.right}
			onPress={handleMintBalancePress}
			disabled={disableMintBalance}
		>
			<MintBalance
				balance={mintBalance}
				txtColor={disableMintBalance ? color.TEXT_SECONDARY : color.TEXT}
				disabled={disableMintBalance}
			/>
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	right: {
		paddingLeft: '20@s',
	},
})