import { AsyncStore } from './AsyncStore'
import { historyStore } from './HistoryStore'
import { SecureStore } from './SecureStore'
import { SimpleKeyValueStore } from './SimpleKeyValueStore'

const store = new SimpleKeyValueStore('__store__')

const asyncStore = new AsyncStore()

export { asyncStore, historyStore, SecureStore, SimpleKeyValueStore, store }

