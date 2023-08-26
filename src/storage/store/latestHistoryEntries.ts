import type { IHistoryEntry } from '@model'

import { historyStore, store } from '.'
import { STORE_KEYS } from './consts'

// 3 latest txs
export async function getLatestHistory() {
	const stored = await store.getObj<IHistoryEntry[]>(STORE_KEYS.latestHistory)
	return !stored ? [] : stored
}

// 3 latest txs
export async function updateLatestHistory(newEntry: IHistoryEntry) {
	const stored = await getLatestHistory()
	if (!stored.length) {
		await store.setObj(STORE_KEYS.latestHistory, [newEntry])
		return
	}
	// max 3 latest history entries
	if (stored.length === 3) { stored.shift() }
	await store.setObj(
		STORE_KEYS.latestHistory,
		[...stored, newEntry]
	)
}

// all txs
export async function addToHistory(entry: Omit<IHistoryEntry, 'timestamp'>) {
	const item = { ...entry, timestamp: Math.ceil(Date.now() / 1000) }
	// complete history
	await historyStore.add(item)
	// latest 3 history entries // TODO provide a historyStore method to retreive the 3 latest entries
	await updateLatestHistory(item)
}