import { type CashuWallet, generateNewMnemonic, type Proof } from '@cashu/cashu-ts'
import { RESTORE_INTERVAL, RESTORE_OVERSHOOT } from '@consts/mints'
import { addToken } from '@db'
import { l } from '@log'
import { getCounterByMintUrl, incrementCounterByMintUrl, saveSeed } from '@store/restore'

import { _setKeys, getSeedWalletByMnemonic } from '.'

export function generateMnemonic(): string | undefined {
	try {
		const mnemonic = generateNewMnemonic()
		l('[generateMnemonic] ', { mnemonic })
		return mnemonic
	} catch (e) {
		l('[generateMnemonic] error', { e })
		throw new Error('generateMnemonic error')
	}
}

export async function restoreWallet(mintUrl: string, mnemonic: string) {
	try {
		// TODO test
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

async function restoreInterval(
	wallet: CashuWallet,
	from: number,
	to: number,
	restoredProofs: Proof[] = [],
	overshoot: number = 0
) {
	try {
		const { proofs, newKeys } = await wallet.restore(from, to)
		from += RESTORE_INTERVAL
		to += RESTORE_INTERVAL
		if (proofs.length) {
			// l('[restoreInterval] restored proofs: ', { from, to, proofsLength: proofs.length })
			restoredProofs.push(...proofs)
			return restoreInterval(wallet, from, to, restoredProofs)
		}
		if (overshoot < RESTORE_OVERSHOOT) {
			// l('[restoreInterval] no proofs to restore! overshooting now: ', { from, to, proofsLength: proofs.length, overshoot })
			overshoot++
			return restoreInterval(wallet, from, to, restoredProofs, overshoot)
		}
		// l('[restoreInterval] no proofs to restore! overshooting limit reached: ', { from, to, restoredProofs: restoredProofs.length, overshoot })
		return { proofs: restoredProofs, newKeys, lastCount: to }
	} catch (e) {
		l('[restoreInterval] error', { e })
	}
}
