import AsyncStorage from '@react-native-async-storage/async-storage'

import { cTo, toJson } from './utils'

export class AsyncStore {
	public static set(key: string, value: string): Promise<void> {
		return AsyncStorage.setItem(key, value)
	}
	public static setObj<T extends object>(key: string, value: T): Promise<void> {
		return AsyncStorage.setItem(key, toJson(value))
	}
	public static get(key: string): Promise<string | null> {
		return AsyncStorage.getItem(key)
	}
	public static async getObj<T extends object>(key: string): Promise<T | null> {
		const s = await AsyncStorage.getItem(key)
		return s ? cTo<T>(s) : null
	}
	public static delete(key: string): Promise<void> {
		return AsyncStorage.removeItem(key)
	}
	public static merge(key: string, value: string) {
		return AsyncStorage.mergeItem(key, value)
	}
	public static mergeObj<T extends object>(key: string, value: T) {
		return AsyncStorage.mergeItem(key, toJson(value))
	}
	public static keys() {
		return AsyncStorage.getAllKeys()
	}
	public static getMany(keys: string[]) {
		return AsyncStorage.multiGet(keys)
	}
	public static async getManyObj<T extends object>(keys: string[]) {
		return (
			(await AsyncStorage.multiGet(keys)).map(([k, v]) => ({ key: k, value: v ? (JSON.parse(v) as T) : null })) ||
			[]
		)
	}
	public static clear() {
		return AsyncStorage.clear()
	}
	public static setMany(keyValuePairs: [string, string][]) {
		return AsyncStorage.multiSet(keyValuePairs)
	}
}
