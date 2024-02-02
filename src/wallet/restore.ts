import { type CashuWallet, generateNewMnemonic, type Proof } from '@cashu/cashu-ts'
import { RESTORE_INTERVAL } from '@consts/mints'
import { addToken } from '@db'
import { l } from '@log'
import { getCounterByMintUrl, incrementCounterByMintUrl, saveSeed } from '@store/restore'

import { _setKeys, getSeedWalletByMnemonic } from '.'

export async function restoreWallet(mintUrl: string, mnemonic: string) {
	try {
		// TODO test
		const { wallet, seed } = await getSeedWalletByMnemonic({ mintUrl, mnemonic })
		// TODO get previous keysets from mint and try to restore from them
		const resp = await restoreInterval(wallet)
		if (!resp) {
			l('[restoreWallet] restore interval did not return a proper object!')
			throw new Error('[restoreWallet] restore interval did not return a proper object!')
		}
		l('[recoverWallet] wallet.restore response: ', { resp })
		const proofsSpent = await wallet.checkProofsSpent(resp.proofs)
		l('[recoverWallet] checkProofsSpent response: ', { proofsSpent })
		const proofs = resp.proofs.filter(x => !proofsSpent.map(y => y.secret).includes(x.secret))
		if (resp.newKeys) { _setKeys(mintUrl, resp.newKeys) }
		await addToken({ token: [{ mint: mintUrl, proofs }] })
		await saveSeed(seed)
		// adds counter if not exists
		await getCounterByMintUrl(mintUrl)
		await incrementCounterByMintUrl(mintUrl, resp.lastCount)
		return proofs
	} catch (e) {
		l('[restoreWallet] error', { e })
	}
}

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

let overshoot = 0
let from = 0
let to = RESTORE_INTERVAL
const restoredProofs: Proof[] = []

async function restoreInterval(wallet: CashuWallet) {
	try {
		const { proofs, newKeys } = await wallet.restore(from, to)
		if (proofs.length || overshoot < 2) {
			restoredProofs.push(...proofs)
			from += RESTORE_INTERVAL
			to += RESTORE_INTERVAL
			overshoot++
			return restoreInterval(wallet)
		}
		const returnVal = {
			proofs: restoredProofs,
			lastCount: to,
			newKeys,
		}
		restoredProofs.length = 0
		from = 0
		to = RESTORE_INTERVAL + 1
		overshoot = 0
		return returnVal
	} catch (e) {
		l('[restoreInterval] error', { e })
	}
}
