import { Nostr } from '@nostr/class/Nostr'
import * as FileSystem from 'expo-file-system'

import { dropAll } from './db'
import { historyStore, secureStore, store } from './store'
import { SECRET, SECURESTORE_KEY } from './store/consts'
import { ttlCache } from './store/ttl'

export async function dropAllData() {
	await Promise.all([
		dropAll(),
		store.clear(),
		secureStore.delete(SECRET),
		secureStore.delete(SECURESTORE_KEY),
		historyStore.clear(),
		Nostr.cleanCache(),
		ttlCache.clear(),
		FileSystem.deleteLegacyDocumentDirectoryAndroid(),
		FileSystem.deleteAsync(FileSystem.cacheDirectory!),
		FileSystem.deleteAsync(FileSystem.documentDirectory!),
	])
}