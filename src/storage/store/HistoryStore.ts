import type { IHistoryEntry, IKeyValuePair } from '@model'

import { type ISelectParams, StoreBase } from './StoreBase'
import { getDb } from './utils'

/**
 * History store
 *
 * @class HistoryStore
 * @extends {StoreBase}
 * @deprecated use queries for db table 'transactions' instead
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
	 * @deprecated use queries for db table 'transactions' instead
	 */
	public async add(entry: IHistoryEntry): Promise<void> {
		await this.#init()
		await super.setObj(`${this.#idx}`, entry)
		this.#idx += 1
	}
	/**
	 * get history entries
	 * @returns Promise<IHistoryEntry[]>
	 * @deprecated use queries for db table 'transactions' instead
	 */
	public async getHistory({ order = 'DESC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IHistoryEntry[]> {
		await this.#init()
		return super.valuesObjs<IHistoryEntry>({ order, start, count, orderBy })
	}
	/**
	 * get history entries with keys
	 * @returns Promise<IKeyValuePair<IHistoryEntry>[]>
	 * @deprecated use queries for db table 'transactions' instead
	 */
	public async getHistoryWithKeys({ order = 'DESC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<IHistoryEntry>[]> {
		await this.#init()
		return super.getObjsAll<IHistoryEntry>({ order, start, count, orderBy })
	}
	/**
	 * @deprecated use queries for db table 'transactions' instead
	 */
	public updateHistoryEntry(oldEntry: IHistoryEntry, newEntry: IHistoryEntry) {
		return super.updateObjByValue(oldEntry, newEntry)
	}
	/**
	 * clear history
	 * @returns Promise<void>
	 * @deprecated use queries for db table 'transactions' instead
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

/**
 * @deprecated use queries for db table 'transactions' instead
 */
export const historyStore = new HistoryStore()
