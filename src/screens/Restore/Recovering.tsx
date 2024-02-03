import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { getBalance } from '@db'
import type { IRecoveringPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { globals } from '@styles'
import { restoreWallet } from '@wallet/restore'
import { useEffect } from 'react'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {

	const { color } = useThemeContext()

	const handleRecovery = async () => {
		const { mintUrl, mnemonic } = route.params
		// TODO UI error handling
		try {
			const proofs = await restoreWallet(mintUrl, mnemonic)
			if (!proofs?.length) {
				// TODO navigate to specific screen
				return
			}
			const bal = await getBalance()
			navigation.navigate('success', {
				mint: mintUrl,
				amount: bal,
				isRestored: true,
				comingFromOnboarding: route.params.comingFromOnboarding,
			})
		} catch (e) {
			l('[handleRecovery] error: ', e)
		}
	}

	useEffect(() => {
		void handleRecovery()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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