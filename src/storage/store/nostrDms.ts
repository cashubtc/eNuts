import { store } from '.'
import { STORE_KEYS } from './consts'

// TODO this data has to be stored using sqlite because store size limit can be reached

/**
 * Gets all pubkeys which we have a conversation with
 */
export async function getNostrDmUsers() {
	const stored = await store.getObj<string[]>(STORE_KEYS.nostrDms)
	return !stored ? [] : stored
}

/**
 * Pushes a new pubkey into an array to save the user that we have a conversation with
 */
export async function updateNostrDmUsers(newDm: string) {
	const stored = await store.getObj<string[]>(STORE_KEYS.nostrDms)
	if (!stored) {
		await store.setObj(STORE_KEYS.nostrDms, [newDm])
		return
	}
	if (stored.includes(newDm)) { return }
	await store.setObj(STORE_KEYS.nostrDms, [...stored, newDm])
}

/**
 * Returns the event signature of each dm where token has been redeemed
 */
export async function getRedeemdedSigs(){
	const stored = await store.getObj<string[]>(STORE_KEYS.nostrRedeemed)
	return !stored ? [] : stored
}

/**
 * Updates the event signature of redeemed token
 */
export async function updateNostrRedeemed(newSig: string) {
	const stored = await store.getObj<string[]>(STORE_KEYS.nostrRedeemed)
	if (!stored) {
		await store.setObj(STORE_KEYS.nostrRedeemed, [newSig])
		return
	}
	if (stored.includes(newSig)) { return }
	await store.setObj(STORE_KEYS.nostrRedeemed, [...stored, newSig])
}