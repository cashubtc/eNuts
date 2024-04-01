import { useRestore } from '@comps/hooks/Restore'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import type { IRecoveringPageProps, TBeforeRemoveEvent } from '@model/nav'
import { preventBack } from '@nav/utils'
import { RESTORE_OVERSHOOT } from '@src/consts/mints'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { formatSatStr } from '@src/util'
import { globals, mainColors } from '@styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {

	const { from, to, mintUrl, keysetId, mnemonic, comingFromOnboarding, shouldOvershoot } = route.params

	const { t } = useTranslation([NS.common])
	// Seed recovery process in useRestore hook
	const { proofs, start, end, overshoot } = useRestore({ from, to, mintUrl, keysetId, mnemonic, comingFromOnboarding, shouldOvershoot })

	const { color } = useThemeContext()

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={s(35)} />
			<Txt
				styles={[styles.descText]}
				txt={t('recoveringWallet')}
			/>
			<Txt
				center
				bold={overshoot > 0}
				styles={[styles.hint, { color: overshoot > 0 ? mainColors.VALID : mainColors.WARN, marginBottom: s(40) }]}
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				txt={overshoot > 0 ? `${t('doneSafety')} ${overshoot}/${RESTORE_OVERSHOOT}` : t('dontClose')}
			/>
			<View style={styles.progress}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt='Keyset-ID'
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={keysetId}
				/>
			</View>
			<View style={styles.progress}>
				<Txt
					bold
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={t('cycle')}
				/>
				<Txt
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
					txt={`${start} ${t('to')} ${end}`}
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
					txt={`${proofs.length} ${t('proofs', { ns: NS.wallet })} (${formatSatStr(proofs.reduce((acc, p) => acc + p.amount, 0))})`}
				/>
			</View>

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
		marginVertical: '20@s',
		textAlign: 'center',
		fontSize: '20@s',
	},
	hint: {
		fontSize: '14@s',
		marginBottom: '10@s',
	},
	progress: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	}
})