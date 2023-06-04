import type { SecureStoreOptions } from 'expo-secure-store'
import * as _SecureStore from 'expo-secure-store'

/**
 * SecureStore provides a way to encrypt and securely store
 * key–value pairs locally on the device.
 * Each Expo project has a separate storage system
 * and has no access to the storage of other Expo projects
 * 
 * Size limit for a value is 2048 bytes. An attempt to store larger values may fail.
 * Currently, we print a warning when the limit is reached, however,
 * in a future SDK version an error might be thrown.
 * @export
 * @class SecureStore
 */
export class SecureStore {
	#options?: SecureStoreOptions
	constructor(options?: SecureStoreOptions) { this.#options = options }
	public static set(key: string, value: string, options?: SecureStoreOptions): Promise<void> {
		return _SecureStore.setItemAsync(key, value, options)
	}
	public set(key: string, value: string, options?: SecureStoreOptions): Promise<void> {
		return SecureStore.set(key, value, options ? options : this.#options)
	}
	public static get(key: string, options?: SecureStoreOptions): Promise<string | null> {
		return _SecureStore.getItemAsync(key, options)
	}
	public get(key: string, options?: SecureStoreOptions): Promise<string | null> {
		return SecureStore.get(key, options ? options : this.#options)
	}
	public static delete(key: string, options?: SecureStoreOptions): Promise<void> {
		return _SecureStore.deleteItemAsync(key, options)
	}
	public delete(key: string, options?: SecureStoreOptions): Promise<void> {
		return SecureStore.delete(key, options ? options : this.#options)
	}
	public static isAvailable(): Promise<boolean> {
		return _SecureStore.isAvailableAsync()
	}
	public isAvailable(): Promise<boolean> {
		return SecureStore.isAvailable()
	}
}



