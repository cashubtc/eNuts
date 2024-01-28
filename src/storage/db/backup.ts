import { generateNewMnemonic, getEncodedToken, type Proof, type Token } from '@cashu/cashu-ts'
import { l } from '@log'
import { STORE_KEYS } from '@store/consts'
import { SecureStore } from '@store/SecureStore'
import { Buffer } from 'buffer/'
import { SHA256 } from 'crypto-js'

import { getMintByKeySetId, getProofs, getProofsByMintUrl } from '.'

async function _backUpToken(proofs: Proof[]) {
	proofs.sort((a, b) => a.id.localeCompare(b.id))
	const proofMap: { [k: string]: Proof[] } = {}
	for (const p of proofs) {
		if (!proofMap[p.id]) { proofMap[p.id] = [p] } else { proofMap[p.id].push(p) }
	}
	const ids = Object.keys(proofMap)
	const result: Token = { token: [] }
	for (const id of ids) {
		// eslint-disable-next-line no-await-in-loop
		const m = await getMintByKeySetId(id)
		if (!m || !proofMap?.[id]?.length) { continue }
		result.token.push({ mint: m.mintUrl, proofs: proofMap[id] })
	}
	return result?.token?.length ? getEncodedToken(result) : ''
}
export async function getBackUpToken() {
	return _backUpToken(await getProofs())
}
export async function getBackUpTokenForMint(mintUrl: string) {
	return _backUpToken(await getProofsByMintUrl(mintUrl))
}

/*
generateNewMnemonic: () => string;
deriveSeedFromMnemonic: (mnemonic: string) => Uint8Array;
deriveSecret: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;
deriveBlindingFactor: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;
*/
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

export async function saveMnemonic(mnemonic: string) {
	try {
		await SecureStore.set(STORE_KEYS.mnemonic, mnemonic)
		l('[saveMnemonic] ', { mnemonic })
	} catch (e) {
		l('[saveMnemonic] error', { e })
		throw new Error('[saveMnemonic] error')
	}
}

export async function getMnemonic() {
	try {
		const mnemonic = await SecureStore.get(STORE_KEYS.mnemonic)
		l('[getMnemonic] ', { mnemonic })
		return mnemonic
	} catch (e) {
		l('[getMnemonic] error', { e })
		throw new Error('[getMnemonic] error')
	}
}

export async function deleteMnemonic() {
	try {
		await SecureStore.delete(STORE_KEYS.mnemonic)
		l('[deleteMnemonic] ')
	} catch (e) {
		l('[deleteMnemonic] error', { e })
		throw new Error('[deleteMnemonic] error')
	}
}

export async function saveSeed(seed: Uint8Array) {
	try {
		const str = Buffer.from(seed).toString('base64')
		l('[saveSeed] base64 ', { seed, base64: str })
		await SecureStore.set(STORE_KEYS.seed, str)
	} catch (e) {
		l('[saveSeed] error', { e })
		throw new Error('[saveSeed] error')
	}
}

export async function getSeed() {
	try {
		const str = await SecureStore.get(STORE_KEYS.seed)
		const buffer = str ? Buffer.from(str, 'base64') : undefined
		const seed = buffer ? new Uint8Array(buffer) : undefined
		l('[getSeed] base64 ', { stored: str, seed })
		return seed
	} catch (e) {
		l('[getSeed] error', { e })
		throw new Error('[getSeed] error')
	}
}

export async function deleteSeed() {
	try {
		await SecureStore.delete(STORE_KEYS.seed)
		l('[deleteSeed] ')
	} catch (e) {
		l('[deleteSeed] error', { e })
		throw new Error('[deleteSeed] error')
	}
}

export async function getSeedHash() {
	try {
		const seed = await getSeed()
		if (!seed) { return }
		// TODO provide global TextDecoder
		const seedString = new TextDecoder().decode(seed)
		// eslint-disable-next-line new-cap
		const hash = SHA256(seedString).toString()
		l('[getSeedHash] ', { hash })
		return hash
	} catch (e) {
		l('[getSeedHash] error', { e })
		throw new Error('[getSeedHash] error')
	}
}
