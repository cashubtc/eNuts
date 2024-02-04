import { l } from '@log'
import { STORE_KEYS } from '@store/consts'
import { Buffer } from 'buffer/'

import { SecureStore } from './SecureStore'

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
