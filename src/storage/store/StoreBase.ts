import type { Db } from '@db/Db'
import { l } from '@log'
import type { IKeyValuePair } from '@model'
import type { Query, SQLResultSetRowList } from 'expo-sqlite/legacy'

import { cTo, getBlankSQLResultSetRowList, toJson } from './utils'

export type TOrder = 'ASC' | 'DESC'
export type TOrderBY = 'insertionOrder' | 'key' | 'value'
export interface ISelectParams {
	start?: number,
	count?: number,
	order?: TOrder
	orderBy?: TOrderBY
}
export abstract class StoreBase {
	#setupDb: Query
	protected readonly _db: Db
	protected _isReady = false
	protected _name: string

	constructor(db: Db, name: string) {
		this._db = db
		this._name = name
		this.#setupDb = {
			sql: `
				CREATE TABLE IF NOT EXISTS ${name} (
					key TEXT PRIMARY KEY,
					value TEXT
				);
				`,
			args: []
		}
		this._createStoreSync()
	}
	#getOrderByPart({ order = 'ASC', orderBy = 'insertionOrder' }: ISelectParams) {
		let sqlOrderBYPart = 'ORDER BY '
		switch (orderBy) {
			case 'insertionOrder':
				sqlOrderBYPart += 'ROWID'
				break
			case 'key':
				// CAST(key AS INTEGER)
				sqlOrderBYPart += 'key'
				break
			case 'value':
				sqlOrderBYPart += 'value'
				break
			default:
				sqlOrderBYPart += 'ROWID'
		}
		return `${sqlOrderBYPart} ${order === 'ASC' ? '' : 'DESC'}`
	}
	async #select<T>(cols: 'key' | 'value' | 'key,value', { order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<SQLResultSetRowList<T>> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return getBlankSQLResultSetRowList<T>() }
		}
		const result = await this._db.execSelect<T>(
			`select ${cols}
			from ${this._name}
			${this.#getOrderByPart({ order, orderBy })}
			${this.#getSelectSuffix({ start, count })}`,
			[]
		)
		return result
	}

	async #selectWhereKeysInArr(
		{ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {},
		arr: string[]

	): Promise<IKeyValuePair<string>[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this._db.execSelect<{ key: string, value: string }>(
			`select key,value
			from ${this._name}
			where key in (${arr.map(x => `'${x}'`).join(',')})
			${this.#getOrderByPart({ order, orderBy })}
			${this.#getSelectSuffix({ start, count })}`,
			[]
		)
		return result._array
	}
	#getSelectSuffix({ start = 0, count = -1 }: ISelectParams) {
		let sqlSuffix = `LIMIT ${count}`
		if (start > 0) { sqlSuffix += ` OFFSET ${start}` }
		return sqlSuffix
	}
	protected _createStoreSync() {
		if (this._isReady) { return }
		this._db.execSync(
			this.#setupDb,
			false,
			(err, resultSet) => {
				if (err) { throw err }
				if (!resultSet) { throw new Error('unable create table: resultSet is null') }
				if (resultSet?.length && 'error' in resultSet[0] && resultSet[0].error) {
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					throw new Error(`unable create table: ${resultSet[0].error}`)
				}
				this._isReady = true
			})
	}
	protected async _createStore() {
		if (this._isReady) { return }
		try {
			await this._db.exec(
				this.#setupDb,
				false
			)
			this._isReady = true
		} catch (e) { l('[_createStore][Error]', e) }
	}

	protected async getByKeys(keys: string[]): Promise<IKeyValuePair<string>[] | null | undefined> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return null }
		}
		return this.#selectWhereKeysInArr({}, keys)
	}
	protected async get(key: string): Promise<string | null | undefined> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return null }
		}
		const result = await this._db.execSelect<{ value: string }>(
			`select value from ${this._name} where key = ? limit 1`,
			[key]
		)
		return result?.item?.(0)?.value
	}
	protected async updateByValue(oldValue: string, newValue: string): Promise<boolean> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return false }
		}
		const result = await this._db.exec({
			sql: `UPDATE ${this._name} SET value = ? WHERE KEY in (SELECT KEY FROM ${this._name} WHERE value = ? LIMIT 1)`,
			args: [newValue, oldValue]
		})
		return !!(result && 'rowsAffected' in result && result?.rowsAffected === 1)
	}
	protected async updateObjByValue<T extends object>(oldValue: T, newValue: T): Promise<boolean> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return false }
		}
		return this.updateByValue(toJson(oldValue), toJson(newValue))
	}
	protected async getObj<T extends object>(key: string): Promise<T | null | undefined> {
		const strVal = await this.get(key)
		if (!strVal) { return null }
		const obj = cTo<T>(strVal)
		return obj
	}

	protected async getByKeyPrefix(prefix: string, { order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<string>[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this._db.execSelect<{ key: string, value: string }>(
			`select key,value from ${this._name} where key like ? 
			${this.#getOrderByPart({ order, orderBy })}
			${this.#getSelectSuffix({ start, count })}`,
			[`${prefix}%`]
		)
		return result._array
	}
	protected async getObjsByKeyPrefix<T extends object>(prefix: string, { order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<T>[]> {
		const strKeyValPairs = await this.getByKeyPrefix(prefix, { order, start, count, orderBy })
		if (!strKeyValPairs) { return [] }
		const objKeyValPairs: IKeyValuePair<T>[] = strKeyValPairs
			.map(x => ({ key: x.key, value: cTo<T>(x.value) }))
		return objKeyValPairs
	}

	protected async getAll({ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<string>[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this.#select<{ key: string, value: string }>('key,value', { order, start, count, orderBy })
		return result._array
	}
	protected async getObjsAll<T extends object>({ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<IKeyValuePair<T>[]> {
		const strKeyValPairs = await this.getAll({ order, start, count, orderBy })
		if (!strKeyValPairs) { return [] }
		const objKeyValPairs: IKeyValuePair<T>[] = strKeyValPairs
			.map(x => ({ key: x.key, value: cTo<T>(x.value) }))
		return objKeyValPairs
	}
	protected async set(key: string, value: string): Promise<boolean> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return false }
		}
		const result = await this._db.execInsert<string>(
			`INSERT OR REPLACE INTO ${this._name} (key,value) VALUES (?, ?)`,
			[key, value]
		)
		return result?.rowsAffected === 1
	}
	protected async setObj<T extends object>(key: string, value: T): Promise<boolean> {
		const result = await this.set(key, toJson(value))
		return result
	}
	protected async keys({ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<string[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this.#select<{ key: string }>('key', { order, start, count, orderBy })
		return result._array.map(x => x.key)
	}
	protected async keysByPrefix(prefix: string, { order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<string[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}

		const result = await this._db.execSelect<{ key: string }>(
			`select key from ${this._name} where key like ? 
			${this.#getOrderByPart({ order, orderBy })}
			${this.#getSelectSuffix({ start, count })}`,
			[`${prefix}%`]
		)
		return result._array.map(x => x.key)
	}
	protected async values({ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<string[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this.#select<{ value: string }>('value', { order, start, count, orderBy })
		return result._array.map(x => x.value)
	}
	protected async valuesObjs<T extends object>({ order = 'ASC', start = 0, count = -1, orderBy = 'insertionOrder' }: ISelectParams = {}): Promise<T[]> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return [] }
		}
		const result = await this.values({ order, start, count, orderBy })
		return result.map(x => cTo<T>(x))
	}
	protected async count(): Promise<number> {
		if (!this._isReady) {
			await this._createStore()
			if (!this._isReady) { return -1 }
		}
		const result = await this._db.execSelect<{ count: number }>(
			`select count(*) as count from ${this._name}`
		)
		return result?.item?.(0)?.count ?? -1
	}
	protected async clear(): Promise<boolean> {
		const result = await this._db.execTx({ sql: `delete from ${this._name}`, args: [] })
		// await this._db.delete()
		return !!(result?.insertId || result?.rowsAffected)
	}
	protected close(): void { return this._db.close() }
	protected async removeItem(key: string) {
		const result = await this._db.execTx({ sql: `delete from ${this._name} where key = ?`, args: [key] })
		return result?.rowsAffected === 1
	}
}