import { historyStore } from './HistoryStore'
import { SecureStore } from './SecureStore'
import { SimpleKeyValueStore } from './SimpleKeyValueStore'

const store = new SimpleKeyValueStore('__store__')

export { historyStore, SecureStore, SimpleKeyValueStore, store }

