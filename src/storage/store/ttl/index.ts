
import { l } from '@src/logger'

import { SimpleKeyValueStore } from '../SimpleKeyValueStore'
import { cTo } from '../utils'

export class TTLCache extends SimpleKeyValueStore {
	#ttl: number
	constructor(name: string, ttl: number) {
		super(name)
		this.#ttl = ttl
		void this.#init()
	}
	async #init(rerun = false) {
		if (this._isReady) { return }
		await super._createStore()
		if (rerun) { return }
		await this.#init(true)
	}
	#wrap(value: string, ttl: number) {
		return JSON.stringify({ value, ttl, expireAt: this.#getTtl() })
	}
	#unwrap<T>(value: string) {
		return cTo<{ value: T, ttl: number, expireAt: number }>(value)
	}
	#isExpired(expireAt: number) {
		return Date.now() > expireAt
	}
	#getTtl() { return this.#ttl + Date.now() }
	public async get(key: string): Promise<string | null | undefined> {
		const wrapped = await super.get(key)
		if (!wrapped) { return null }
		const v = this.#unwrap<string>(wrapped)
		if (!v?.value) { return null }
		if (this.#isExpired(v.expireAt)) {
			void this.delete(key)
			return Promise.resolve(null)
		}
		return v.value
	}
	public async getObj<T extends object>(key: string): Promise<T | null | undefined> {
		try {
			const v = await this.get(key)
			if (!v) { return null }
			const o = cTo<T>(v)
			if (!o) { return null }
			return o
		} catch (error) {
			l('getObj', { error })
		}

	}
	public set(key: string, value: string): Promise<boolean> {
		return super.set(key, this.#wrap(value, this.#getTtl()))
	}
	public setObj<T extends object>(key: string, value: T): Promise<boolean> {
		return super.setObj(key, value)
	}
	public async getObjsByKeys<T extends object>(keys: string[] = []): Promise<{ key: string; value: NonNullable<T> }[] | null> {
		// let results: IKeyValuePair<string>[] | null | undefined
		if (!keys?.length) {
			/* const keys = await this.keys()
			results = await super.getByKeys(keys) */
			return null
		} 
		const results = await super.getByKeys(keys)
		
		if (!results?.length) { return null }
		return results.map(({ key, value }) => {
			try {
				const v = this.#unwrap<string>(value)
				if (!v?.value) { return null }
				if (this.#isExpired(v.expireAt)) {
					void this.delete(key)
					return null
				}
				const o = cTo<T>(v.value)
				if (!o) { return null }
				return { key, value: o }
			} catch (error) {
				l('getObjsByKeys', { error })
			}

		}).filter((x): x is { key: string, value: NonNullable<T> } => !!x?.value)
	}
	public async clean() {
		await this.getObjsByKeys<object>()
	}
	public clear() { return super.clear() }
}



export const ttlCache = new TTLCache('__ttlCache__', 1000 * 60 * 60 * 24)