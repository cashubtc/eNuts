import type { IHistoryEntry, IInvoice, IKeyValuePair } from '@model'
import { getHistoryGroupDate } from '@util'

import { type ISelectParams, StoreBase } from './StoreBase'
import { getDb } from './utils'

/**
 * History store
 *
 * @class HistoryStore
 * @extends {StoreBase}
 */
class HistoryStore extends StoreBase {
	#idx = -1
	/**
	 * get entry count
	 *
	 * @readonly
	 * @memberof HistoryStore
	 */
	public get entryCount(): number { return this.#idx < 0 ? 0 : this.#idx }
	/**
	 * Creates an instance of HistoryStore.
	 * @memberof HistoryStore
	 */
	constructor() {
		super(getDb('HistoryStore'), 'HistoryStore')
		void this.#init()
	}
	async #init(rerun = false): Promise<void> {
		if (this._isReady && this.#idx !== -1) { return }
		if (!this._isReady) { await super._createStore() }
		this.#idx = await super.count()
		if (rerun) { return }
		await this.#init(true)
	}

	/**
	 * add history entry
	 * @param entry
	 * @returns Promise<void>
	 */
	public async add(entry: IHistoryEntry): Promise<void> {
		await this.#init()
		await super.setObj(`${this.#idx}`, entry)
		this.#idx += 1
	}
	/**
	 * get history entries
	 * @returns Promise<IHistoryEntry[]>
	 */
	public async getHistory({ order = 'DESC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IHistoryEntry[]> {
		await this.#init()
		return super.valuesObjs<IHistoryEntry>({ order, start, count, orderBy })
	}
	/**
	 * get history entries with keys
	 * @returns Promise<IKeyValuePair<IHistoryEntry>[]>
	 */
	public async getHistoryWithKeys({ order = 'DESC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<IHistoryEntry>[]> {
		await this.#init()
		return super.getObjsAll<IHistoryEntry>({ order, start, count, orderBy })
	}
	public updateHistoryEntry(oldEntry: IHistoryEntry, newEntry: IHistoryEntry) {
		return super.updateObjByValue(oldEntry, newEntry)
	}
	/**
	 * clear history
	 * @returns Promise<void>
	 */
	public async clear(): Promise<boolean> {
		await this.#init()
		this.#idx = -1
		return super.clear()
	}
	/**
	 * close store
	 * @returns void
	 */
	public close(): void { return super.close() }
}

export const historyStore = new HistoryStore()

export async function getHistory({ order = 'DESC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}) {
	const history = await historyStore.getHistory({ order, start, count, orderBy })
	return groupEntries(history)
}

export function getHistoryEntryByInvoice(entries: IHistoryEntry[], invoice: string) {
	return entries.find(i => i.value === invoice)
}

export async function getHistoryEntriesByInvoices(invoices: IInvoice[]) {
	const history = await historyStore.getHistory()
	return history.filter(h => invoices.map(i => i.pr).includes(h.value))
}

function groupEntries(history: IHistoryEntry[]) {
	return groupBy(history, i => getHistoryGroupDate(new Date(i.timestamp * 1000)))
}

// https://stackoverflow.com/questions/42136098/array-groupby-in-typescript
function groupBy(arr: IHistoryEntry[], key: (i: IHistoryEntry) => string) {
	return arr.reduce((groups, item) => {
		(groups[key(item)] ??= []).push(item)
		return groups
	}, {} as Record<string, IHistoryEntry[]>)
}