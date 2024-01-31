import type { Proof } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import type { IRecoveringPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { restoreWallet } from '@src/wallet'
import { globals } from '@styles'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ route }: IRecoveringPageProps) {

	const { color } = useThemeContext()

	const [recoveredProofs, setRecoveredProofs] = useState<Proof[]>()

	const handleRecovery = async () => {
		const { mintUrl, mnemonic } = route.params
		try {
			const resp = await restoreWallet(mintUrl, mnemonic)
			setRecoveredProofs(resp?.proofs)
			// TODO handle recoverWallet response
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
			{recoveredProofs && recoveredProofs.length > 0 &&
				recoveredProofs.map((proof, i) => (
					<Txt
						key={i}
						styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
						txt={`Recovered proof ${i + 1}: ${proof.amount}`}
					/>
				))
			}
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