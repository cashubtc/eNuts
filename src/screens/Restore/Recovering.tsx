import type { CashuWallet, MintKeys, Proof } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { RESTORE_INTERVAL, RESTORE_OVERSHOOT } from '@consts/mints'
import { addToken, getMintBalance } from '@db'
import { l } from '@log'
import type { IRecoveringPageProps, TBeforeRemoveEvent } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { saveSeed } from '@store/restore'
import { globals, mainColors } from '@styles'
import { formatSatStr, isErr } from '@util'
import { _setKeys, getCounterByMintUrl, getSeedWalletByMnemonic, incrementCounterByMintUrl } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

type TRestoreInterval = Promise<{ proofs: Proof[]; newKeys?: MintKeys; start: number; lastCount: number } | undefined>

export default function RecoveringScreen({ navigation, route }: IRecoveringPageProps) {

	const { from, to, mintUrl, keysetId, mnemonic, comingFromOnboarding, shouldOvershoot } = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()

	const [restored, setRestored] = useState({
		proofs: [] as Proof[],
		start: from,
		end: to,
		overshoot: 0,
	})

	const resetRestoredState = () => {
		setRestored({
			proofs: [] as Proof[],
			start: from,
			end: to,
			overshoot: 0,
		})
	}

	const restore = async () => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const { start, end } = await restoreWallet(mintUrl, mnemonic)
			const bal = await getMintBalance(mintUrl)
			// TODO save keysetID as restored: [{ keysetId, amount: bal }, ...]
			navigation.navigate('restoreOverview', {
				mnemonic,
				mint: mintUrl,
				keysetID: keysetId,
				cycle: { start, end },
				amount: bal,
				comingFromOnboarding,
			})
		} catch (e) {
			l('[handleRecovery] error: ', e)
			resetRestoredState()
			navigation.navigate('processingError', {
				errorMsg: isErr(e) ? e.message : t('restoreErr'),
				comingFromOnboarding,
			})
		}
	}

	const restoreWallet = async (mintUrl: string, mnemonic: string) => {
		try {
			const { wallet, seed } = await getSeedWalletByMnemonic({ mintUrl, mnemonic })
			const resp = await restoreInterval(wallet, from, to)
			if (!resp) {
				l('[restoreWallet] restore interval did not return a proper object!')
				throw new Error('[restoreWallet] restore interval did not return a proper object!')
			}
			const { proofs, newKeys, start, lastCount } = resp
			await saveSeed(seed)
			// adds counter if not exists
			await getCounterByMintUrl(mintUrl)
			if (!proofs.length) {
				l('[restoreWallet] no proofs found during the restore process!')
				return { start: from, end: to }
			}
			const proofsSpent = await wallet.checkProofsSpent(proofs)
			const proofsUnspent = proofs.filter(p => !proofsSpent.map(x => x.secret).includes(p.secret))
			if (newKeys) { _setKeys(mintUrl, newKeys) }
			await addToken({ token: [{ mint: mintUrl, proofs: proofsUnspent }] })
			await incrementCounterByMintUrl(mintUrl, lastCount + 1)
			return { start, end: lastCount }
		} catch (e) {
			l('[restoreWallet] error', { e })
			return { start: from, end: to }
		}
	}

	const restoreInterval = async (
		wallet: CashuWallet,
		start: number,
		end: number,
		restoredProofs: Proof[] = [],
		overshoot: number = 0
	): TRestoreInterval => {
		try {
			const { proofs, newKeys } = await wallet.restore(start, end, keysetId)
			l('[restoreInterval] restored proofs: ', { from: start, to: end, proofsLength: proofs.length })
			if (proofs.length) {
				restoredProofs.push(...proofs)
				overshoot = 0
				start += RESTORE_INTERVAL
				end += RESTORE_INTERVAL
				setRestored({ proofs: restoredProofs, start, end, overshoot })
				return restoreInterval(wallet, start, end, restoredProofs, overshoot)
			}
			if (shouldOvershoot && overshoot < RESTORE_OVERSHOOT) {
				l('[restoreInterval] no proofs to restore! overshooting now: ', { proofsLength: proofs.length, overshoot })
				overshoot++
				start += RESTORE_INTERVAL
				end += RESTORE_INTERVAL
				setRestored({ proofs: restoredProofs, start, end, overshoot })
				return restoreInterval(wallet, start, end, restoredProofs, overshoot)
			}
			l('[restoreInterval] no proofs to restore! overshooting limit reached: ', { restoredProofsLength: restoredProofs.length, overshoot })
			return { proofs: restoredProofs, newKeys, start, lastCount: end }
		} catch (e) {
			l('[restoreInterval] error', { e })
			return { proofs: restoredProofs, newKeys: undefined, start, lastCount: end }
		}
	}

	useEffect(() => {
		resetRestoredState()
		void restore()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mintUrl, keysetId, from, to])

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
				bold={restored.overshoot > 0}
				styles={[styles.hint, { color: restored.overshoot > 0 ? mainColors.VALID : mainColors.WARN, marginBottom: s(40) }]}
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				txt={restored.overshoot > 0 ? `${t('doneSafety')} ${restored.overshoot}/${RESTORE_OVERSHOOT}` : t('dontClose')}
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
					txt={`${restored.start} ${t('to')} ${restored.end}`}
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
					txt={`${restored.proofs.length} ${t('proofs', { ns: NS.wallet })} (${formatSatStr(restored.proofs.reduce((acc, p) => acc + p.amount, 0))})`}
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