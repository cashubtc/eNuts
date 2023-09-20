import * as FileSystem from 'expo-file-system'

import { dropAll } from './db'
import { historyStore, secureStore, store } from './store'
import { SECRET, SECURESTORE_KEY } from './store/consts'
import { TTLCache, ttlCache } from './store/ttl'

export async function dropAllData() {
	await Promise.allSettled([
		dropAll(),
		store.clear(),
		secureStore.delete(SECRET),
		secureStore.delete(SECURESTORE_KEY),
		historyStore.clear(),
		new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24).clear(),
		ttlCache.clear(),
		FileSystem.deleteLegacyDocumentDirectoryAndroid(),
		FileSystem.deleteAsync(FileSystem.cacheDirectory!),
		FileSystem.deleteAsync(FileSystem.documentDirectory!),
	])
}