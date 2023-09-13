import { dropAll } from './db'
import { historyStore, secureStore, store } from './store'
import { SECRET, SECURESTORE_KEY } from './store/consts'

export async function dropAllData() {
	await Promise.all([
		dropAll(),
		store.clear(),
		secureStore.delete(SECRET),
		secureStore.delete(SECURESTORE_KEY),
		historyStore.clear()
	])
}