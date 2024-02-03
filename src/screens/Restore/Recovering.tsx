import { useRestore } from '@comps/hooks/Restore'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import type { IRecoveringPageProps } from '@model/nav'
import { RESTORE_OVERSHOOT } from '@src/consts/mints'
import { useThemeContext } from '@src/context/Theme'
import { formatSatStr } from '@src/util'
import { globals, mainColors } from '@styles'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ route }: IRecoveringPageProps) {

	const { mintUrl, mnemonic, comingFromOnboarding } = route.params
	// Seed recovery process in useRestore hook
	const { proofs, from, to, overshoot } = useRestore({ mintUrl, mnemonic, comingFromOnboarding })

	const { color } = useThemeContext()

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={s(35)} />
			<Txt
				styles={[styles.descText]}
				txt='Recovering your wallet...'
			/>
			<Txt
				bold
				center
				styles={[styles.warn, { color: mainColors.WARN }]}
				txt='Please do not close the app during the process.'
			/>
			<View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt='Restore cycle'
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`${from} to ${to}`}
				/>
			</View>
			<View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt='Restored proofs'
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`${proofs.length} (${formatSatStr(proofs.reduce((acc, p) => acc + p.amount, 0))})`}
				/>
			</View>
			{overshoot > 0 &&
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`Almost done. Safety check ${overshoot}/${RESTORE_OVERSHOOT}`}
				/>
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
		marginTop: '20@s',
		textAlign: 'center',
		fontSize: '20@s',
	},
	warn: {
		marginTop: '10@s',
		marginBottom: '40@s',
	},
	hint: {
		fontSize: '12@s',
		marginTop: '10@s',
	}
})