import { l } from '@log'
import { getMintCurrentKeySetId } from '@src/wallet'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { cTo, toJson } from '@store/utils'
import { SHA256 } from 'crypto-js'

import { SecureStore } from './SecureStore'

// This is a simple counter that is used to keep track of the number of proofs per keysetId.

interface ICounters {
	[key: string]: number
}

export async function incrementCounterByMintUrl(mintUrl: string, count: number) {
	try {
		const seed = await getSeed()
		if (!seed) { return }
		const counters = await store.get(STORE_KEYS.restoreCounter)
		if (!counters) {
			throw new Error('Seed is available but counters have not been set!')
		}
		const parsedCounters = cTo<ICounters>(counters)
		const keysetId = await getMintCurrentKeySetId(mintUrl)
		l('[before increment] ', { keysetId, counter: parsedCounters[keysetId] })
		parsedCounters[keysetId] = (parsedCounters[keysetId] || 0) + count
		l('[after increment] ', { keysetId, counter: parsedCounters[keysetId] })
		await store.set(STORE_KEYS.restoreCounter, toJson(parsedCounters))
	} catch (e) {
		l('[incrementCounterByKeysetId] Error during counter increment: ', e)
		throw new Error('[incrementCounterByKeysetId] Error during counter increment')
	}
}

export async function getCounterByMintUrl(mintUrl: string) {
	try {
		const counters = await store.get(STORE_KEYS.restoreCounter)
		const keysetId = await getMintCurrentKeySetId(mintUrl)
		if (!counters) {
			// store counters for current keyset of mint url passed as param
			await store.set(STORE_KEYS.restoreCounter, toJson({ [keysetId]: 0 }))
			return 0
		}
		const parsedCounters = cTo<ICounters>(counters)
		l('[getCounterByMintUrl] ', { storedCounters: parsedCounters })
		if (!parsedCounters[keysetId]) { parsedCounters[keysetId] = 0 }
		await store.set(STORE_KEYS.restoreCounter, toJson(parsedCounters))
		l('[getCounterByMintUrl] ', { keysetId, counter: parsedCounters[keysetId] })
		return parsedCounters[keysetId]
	} catch (e) {
		l('[getCounterByMintUrl] Error while getCounter: ', e)
		throw Error('[getCounterByMintUrl] Error while getCounter')
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

// not used yet
export async function saveMnemonic(mnemonic: string) {
	try {
		await SecureStore.set(STORE_KEYS.mnemonic, mnemonic)
		l('[saveMnemonic] ', { mnemonic })
	} catch (e) {
		l('[saveMnemonic] error', { e })
		throw new Error('[saveMnemonic] error')
	}
}

// not used yet
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

// not used yet
export async function deleteMnemonic() {
	try {
		await SecureStore.delete(STORE_KEYS.mnemonic)
		l('[deleteMnemonic] ')
	} catch (e) {
		l('[deleteMnemonic] error', { e })
		throw new Error('[deleteMnemonic] error')
	}
}

// not used yet
export async function deleteSeed() {
	try {
		await SecureStore.delete(STORE_KEYS.seed)
		l('[deleteSeed] ')
	} catch (e) {
		l('[deleteSeed] error', { e })
		throw new Error('[deleteSeed] error')
	}
}

// not used yet
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