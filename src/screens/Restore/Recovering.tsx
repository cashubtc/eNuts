import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { getBalance } from '@db'
import { l } from '@log'
import type { IRecoveringPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/latestHistoryEntries'
import { globals } from '@styles'
import { isErr } from '@util'
import { restoreWallet } from '@wallet/restore'
import { useEffect } from 'react'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {

	const { mintUrl, mnemonic, comingFromOnboarding } = route.params
	// TODO show restore progress
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()

	const handleRecovery = async () => {
		try {
			const proofs = await restoreWallet(mintUrl, mnemonic)
			if (!proofs?.length) {
				openPromptAutoClose({ msg: 'Found no proofs to restore the wallet', success: false })
				if (comingFromOnboarding) {
					return navigation.navigate('auth', { pinHash: '' })
				}
				return navigation.navigate('dashboard')
			}
			const bal = await getBalance()
			await addToHistory({
				mints: [mintUrl],
				amount: bal,
				type: 4,
				value: '',
			})
			navigation.navigate('success', {
				mint: mintUrl,
				amount: bal,
				isRestored: true,
				comingFromOnboarding,
			})
		} catch (e) {
			l('[handleRecovery] error: ', e)
			navigation.navigate('processingError', {
				errorMsg: isErr(e) ? e.message : 'An error occurred while restoring your wallet',
				comingFromOnboarding,
			})
		}
	}

	// TODO translate

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void handleRecovery(), [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={s(35)} />
			<Txt
				styles={[styles.descText]}
				txt='Recovering your wallet...'
			/>
			<Txt
				center
				styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
				txt='Please do not close the app during the process. This may take a few seconds...'
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: '20@s',
	},
	descText: {
		marginTop: '20@vs',
		textAlign: 'center',
	},
	hint: {
		fontSize: '12@vs',
		marginTop: '10@vs',
	}
})