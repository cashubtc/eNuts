import { l } from '@log'
import { STORE_KEYS } from '@store/consts'
import { Buffer } from 'buffer/'

import { SecureStore } from './SecureStore'

export async function saveSeed(seed: Uint8Array) {
	try {
		const str = Buffer.from(seed).toString('base64')
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
		return buffer ? new Uint8Array(buffer) : undefined
	} catch (e) {
		l('[getSeed] error', { e })
		throw new Error('[getSeed] error')
	}
}
