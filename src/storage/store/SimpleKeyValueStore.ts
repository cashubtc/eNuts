import type { IKeyValuePair } from '@model'

import { StoreBase } from './StoreBase'
import { getDb } from './utils'

export class SimpleKeyValueStore extends StoreBase {
	constructor(name: string) {
		super(getDb(name), name)
		void this.#init()
	}
	async #init() {
		if (super._isReady) { return }
		await super._createStore()
	}
	public get(key: string): Promise<string | null | undefined> {
		return super.get(key)
	}
	public getObj<T extends object>(key: string): Promise<T | null | undefined> {
		return super.getObj(key)
	}

	public getByKeyPrefix(prefix: string): Promise<IKeyValuePair<string>[]> {
		return super.getByKeyPrefix(prefix)
	}
	public getObjsByKeyPrefix<T extends object>(prefix: string): Promise<IKeyValuePair<T>[]> {
		return super.getObjsByKeyPrefix(prefix)
	}
	public getAll(): Promise<IKeyValuePair<string>[]> {
		return super.getAll()
	}
	public getObjsAll<T extends object>(): Promise<IKeyValuePair<T>[]> {
		return super.getObjsAll()
	}
	public set(key: string, value: string): Promise<boolean> {
		return super.set(key, value)
	}
	public setObj<T extends object>(key: string, value: T): Promise<boolean> {
		return super.setObj(key, value)
	}
	public keys(): Promise<string[]> {
		return super.keys()
	}
	public count(): Promise<number> {
		return super.count()
	}
	public keysByPrefix(prefix: string): Promise<string[]> {
		return super.keysByPrefix(prefix)
	}
	public clear(): Promise<boolean> { return super.clear() }
	public close(): void { return super.close() }
}

