import type { IHistoryEntry } from '@model'

import { historyStore, store } from '.'
import { STORE_KEYS } from './consts'

/**
 * @deprecated use getTransactions(limit) instead
 */
export async function getLatestHistory() {
	const stored = await store.getObj<IHistoryEntry[]>(STORE_KEYS.latestHistory)
	return !stored ? [] : stored
}

/**
 * @deprecated use updatePendingTransactionByInvoice(invoice) instead
 */
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

/**
 * @deprecated use addTransaction(newTx) instead
 */
export async function addToHistory(entry: Omit<IHistoryEntry, 'timestamp'>) {
	const item = { ...entry, timestamp: Math.ceil(Date.now() / 1000) }
	// complete history
	await historyStore.add(item)
	await updateLatestHistory(item)
	return item
}

/**
 * @deprecated use updatePendingTransactionByInvoice(invoice) instead
 */
export async function updateHistory(oldEntry: IHistoryEntry, newEntry: IHistoryEntry) {
	await historyStore.updateHistoryEntry(oldEntry, newEntry)
	const stored = await getLatestHistory()
	const idx = stored.findIndex(i => i.value === oldEntry.value)
	if (idx === -1) { return }
	stored[idx] = newEntry
	await store.setObj(STORE_KEYS.latestHistory, stored)
}