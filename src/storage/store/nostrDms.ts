import { IContact } from '@model/nostr'
import { uniqByIContacts } from '@util'

import { store } from '.'
import { STORE_KEYS } from './consts'

// TODO this data has to be stored using sqlite because store size limit can be reached

/**
 * Gets all contact objects which we have a conversation with
 */
export async function getNostrDmUsers() {
	const stored = await store.getObj<IContact[]>(STORE_KEYS.nostrDms)
	return !stored ? [] : stored
}

/**
 * Pushes a new contact object into an array to save the user that we have a conversation with
 */
export async function updateNostrDmUsers(newDm: IContact) {
	const stored = await getNostrDmUsers()
	if (!stored.length) {
		await store.setObj(STORE_KEYS.nostrDms, [newDm])
		return
	}
	await store.setObj(STORE_KEYS.nostrDms, uniqByIContacts([...stored, newDm], 'hex'))
}

/**
 * Returns the event signature of each dm where token has been redeemed
 */
export async function getRedeemdedSigs() {
	const stored = await store.getObj<string[]>(STORE_KEYS.nostrRedeemed)
	return !stored ? {} : Object.fromEntries(stored.map(x => [x, x]))
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
	const map = Object.fromEntries(stored.map(x => [x, x]))
	if (map[newSig]) { return }
	await store.setObj(STORE_KEYS.nostrRedeemed, [...Object.values(map), newSig])
}