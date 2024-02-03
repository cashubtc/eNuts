import { useRestore } from '@comps/hooks/Restore'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import type { IRecoveringPageProps } from '@model/nav'
import { RESTORE_OVERSHOOT } from '@src/consts/mints'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { formatSatStr } from '@src/util'
import { globals, mainColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ route }: IRecoveringPageProps) {

	const { mintUrl, mnemonic, comingFromOnboarding } = route.params

	const { t } = useTranslation([NS.common])
	// Seed recovery process in useRestore hook
	const { proofs, from, to, overshoot } = useRestore({ mintUrl, mnemonic, comingFromOnboarding })

	const { color } = useThemeContext()

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={s(35)} />
			<Txt
				styles={[styles.descText]}
				txt={t('recoveringWallet')}
			/>
			<Txt
				bold
				center
				styles={[styles.warn, { color: mainColors.WARN }]}
				txt={t('dontClose')}
			/>
			<View style={styles.progress}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={t('cycle')}
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`${from} ${t('to')} ${to}`}
				/>
			</View>
			<View style={styles.progress}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={t('restored')}
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`${proofs.length} (${formatSatStr(proofs.reduce((acc, p) => acc + p.amount, 0))})`}
				/>
			</View>
			{overshoot > 0 &&
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY, marginTop: s(40) }]}
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					txt={`${t('doneSafety')} ${overshoot}/${RESTORE_OVERSHOOT}`}
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
	},
	progress: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	}
})