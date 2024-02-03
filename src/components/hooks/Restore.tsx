import type { CashuWallet, MintKeys, Proof } from '@cashu/cashu-ts'
import { RESTORE_INTERVAL, RESTORE_OVERSHOOT } from '@consts/mints'
import { addToken, getMintBalance } from '@db'
import { l } from '@log'
import type { RootStackParamList } from '@model/nav'
import { type NavigationProp, useNavigation } from '@react-navigation/core'
import { usePromptContext } from '@src/context/Prompt'
import { NS } from '@src/i18n'
import { addToHistory } from '@store/latestHistoryEntries'
import { getCounterByMintUrl, incrementCounterByMintUrl, saveSeed } from '@store/restore'
import { isErr } from '@util'
import { _setKeys, getSeedWalletByMnemonic } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type StackNavigation = NavigationProp<RootStackParamList>

type TRestoreInterval = Promise<{ proofs: Proof[]; newKeys?: MintKeys; lastCount: number } | undefined>

interface IUseRestoreProps {
	mintUrl: string
	mnemonic: string
	comingFromOnboarding?: boolean
}

const defaultRestoreState = {
	proofs: [] as Proof[],
	from: 0,
	to: RESTORE_INTERVAL,
	overshoot: 0,
}

export function useRestore({ mintUrl, mnemonic, comingFromOnboarding }: IUseRestoreProps) {

	const navigation = useNavigation<StackNavigation>()
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()

	const [restored, setRestored] = useState({ ...defaultRestoreState })

	useEffect(() => {
		const restore = async () => {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const proofs = await restoreWallet(mintUrl, mnemonic)
				if (!proofs?.length) {
					openPromptAutoClose({ msg: t('noProofsRestored'), success: false })
					setRestored({ ...defaultRestoreState })
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
				setRestored({ ...defaultRestoreState })
				navigation.navigate('success', {
					mint: mintUrl,
					amount: bal,
					isRestored: true,
					comingFromOnboarding,
				})
			} catch (e) {
				l('[handleRecovery] error: ', e)
				setRestored({ ...defaultRestoreState })
				navigation.navigate('processingError', {
					errorMsg: isErr(e) ? e.message : t('restoreErr'),
					comingFromOnboarding,
				})
			}
		}
		const restoreWallet = async (mintUrl: string, mnemonic: string) => {
			try {
				const { wallet, seed } = await getSeedWalletByMnemonic({ mintUrl, mnemonic })
				// TODO get previous keysets from mint and try to restore from them
				const resp = await restoreInterval(wallet, 0, RESTORE_INTERVAL)
				if (!resp) {
					l('[restoreWallet] restore interval did not return a proper object!')
					throw new Error('[restoreWallet] restore interval did not return a proper object!')
				}
				await saveSeed(seed)
				// adds counter if not exists
				await getCounterByMintUrl(mintUrl)
				if (!resp.proofs.length) {
					l('[restoreWallet] no proofs found during the restore process!')
					return []
				}
				const proofsSpent = await wallet.checkProofsSpent(resp.proofs)
				const proofs = resp.proofs.filter(p => !proofsSpent.map(x => x.secret).includes(p.secret))
				if (resp.newKeys) { _setKeys(mintUrl, resp.newKeys) }
				await addToken({ token: [{ mint: mintUrl, proofs }] })
				await incrementCounterByMintUrl(mintUrl, resp.lastCount + 1)
				return proofs
			} catch (e) {
				l('[restoreWallet] error', { e })
			}
		}
		const restoreInterval = async (
			wallet: CashuWallet,
			from: number,
			to: number,
			restoredProofs: Proof[] = [],
			overshoot: number = 0
		): TRestoreInterval => {
			try {
				setRestored({ proofs: restoredProofs, from, to, overshoot })
				const { proofs, newKeys } = await wallet.restore(from, to)
				from += RESTORE_INTERVAL
				to += RESTORE_INTERVAL
				if (proofs.length) {
					l('[restoreInterval] restored proofs: ', { from, to, proofsLength: proofs.length })
					restoredProofs.push(...proofs)
					overshoot = 0
					return restoreInterval(wallet, from, to, restoredProofs, overshoot)
				}
				if (overshoot < RESTORE_OVERSHOOT) {
					l('[restoreInterval] no proofs to restore! overshooting now: ', { from, to, proofsLength: proofs.length, overshoot })
					overshoot++
					return restoreInterval(wallet, from, to, restoredProofs, overshoot)
				}
				l('[restoreInterval] no proofs to restore! overshooting limit reached: ', { from, to, restoredProofs: restoredProofs.length, overshoot })
				return { proofs: restoredProofs, newKeys, lastCount: to }
			} catch (e) {
				l('[restoreInterval] error', { e })
			}
		}
		void restore()
	}, [comingFromOnboarding, mintUrl, mnemonic, navigation, openPromptAutoClose, t])

	return { ...restored }
}
