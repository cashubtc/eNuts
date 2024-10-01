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

// TODO
// show internet connection status
// show different quotes messages during the process

export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {

	const { mintUrl, mnemonic, comingFromOnboarding } = route.params

	const { t } = useTranslation([NS.common])
	// Seed recovery process in useRestore hook
	const { proofs, from, to, overshoot } = useRestore({ mintUrl, mnemonic, comingFromOnboarding })

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
			<Txt
				center
				bold={overshoot > 0}
				styles={[styles.hint, { color: overshoot > 0 ? mainColors.VALID : mainColors.WARN, marginTop: s(40) }]}
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				txt={overshoot > 0 ? `${t('doneSafety')} ${overshoot}/${RESTORE_OVERSHOOT}` : t('dontClose')}
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
		marginTop: '20@s',
		marginBottom: '30@s',
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