import MintBalance from '@comps/MintBalance'
import { useThemeContext } from '@src/context/Theme'
import { StyleSheet, TouchableOpacity } from 'react-native'

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

const styles = StyleSheet.create({
	right: {
		paddingLeft: 20,
	},
})