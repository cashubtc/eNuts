import type { CashuWallet, MintKeys, Proof } from '@cashu/cashu-ts'
import { RESTORE_INTERVAL, RESTORE_OVERSHOOT } from '@consts/mints'
import { addToken, getMintBalance } from '@db'
import { l } from '@log'
import type { RootStackParamList } from '@model/nav'
import { type NavigationProp, useNavigation } from '@react-navigation/core'
import { usePromptContext } from '@src/context/Prompt'
import { NS } from '@src/i18n'
import { addToHistory } from '@store/latestHistoryEntries'
import { saveSeed } from '@store/restore'
import { isErr } from '@util'
import { _setKeys, getCounterByMintUrl, getSeedWalletByMnemonic, incrementCounterByMintUrl } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type StackNavigation = NavigationProp<RootStackParamList>

type TRestoreInterval = Promise<{ proofs: Proof[]; newKeys?: MintKeys; start: number; lastCount: number } | undefined>

interface IUseRestoreProps {
	from: number
	to: number
	mintUrl: string
	keysetId: string
	mnemonic: string
	comingFromOnboarding?: boolean
	shouldOvershoot?: boolean
}

export function useRestore({ from, to, mintUrl, keysetId, mnemonic, comingFromOnboarding, shouldOvershoot }: IUseRestoreProps) {

	const navigation = useNavigation<StackNavigation>()
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()

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
			const { proofs, start, end } = await restoreWallet(mintUrl, mnemonic)
			if (!proofs?.length) {
				openPromptAutoClose({ msg: t('noProofsRestored'), success: false })
				resetRestoredState()
				if (comingFromOnboarding) {
					return navigation.navigate('auth', { pinHash: '' })
				}
				return navigation.navigate('dashboard')
			}
			const bal = await getMintBalance(mintUrl)
			await addToHistory({
				mints: [mintUrl],
				amount: bal,
				type: 4,
				value: '',
			})
			navigation.navigate('restoreSuccess', {
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
				return { proofs: [], start: from, end: to }
			}
			const proofsSpent = await wallet.checkProofsSpent(proofs)
			const proofsUnspent = proofs.filter(p => !proofsSpent.map(x => x.secret).includes(p.secret))
			if (newKeys) { _setKeys(mintUrl, newKeys) }
			await addToken({ token: [{ mint: mintUrl, proofs: proofsUnspent }] })
			await incrementCounterByMintUrl(mintUrl, lastCount + 1)
			return { proofs: proofsUnspent, start, end: lastCount }
		} catch (e) {
			l('[restoreWallet] error', { e })
			return { proofs: [], start: from, end: to }
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
		void restore()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mintUrl, keysetId, from, to])

	return restored
}
