import { Db } from '@db/Db'
import { l } from '@src/logger'
import * as SQLite from 'expo-sqlite/legacy'


/* const _storeDbs: { [k: string]: SimpleKeyValueStore } = {} */

export function getDb(name: string) {
	return new Db(SQLite.openDatabase(`${name}.db`))
}

/* export function getStore(name: string) {
	const tmp = _storeDbs[name]
	if (tmp && tmp instanceof StoreBase) { return tmp }
	const store = new SimpleKeyValueStore(name)
	_storeDbs[name] = store
	return store
} */

export function getBlankSQLResultSetRowList<T>() { return { length: 0, _array: [] as T[] } }

export function cTo<T extends object>(s: string) {
	try {
		return JSON.parse(s) as T
	} catch (error) {
		l('cTo',error,s)
	}
	return JSON.parse(s) as T
}

export function toJson<T extends object>(o: T) {
	return JSON.stringify(o)
}
