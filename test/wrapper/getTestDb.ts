import type { Query, SQLiteCb, WebSQLDatabase } from 'expo-sqlite/legacy'
import type { Database } from 'sqlite3'
//import { l } from '@log';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SQLite from 'websql'

interface IWebSQLDatabase extends WebSQLDatabase {
	_db?: {
		exec<T = unknown>(queries: Query[], readOnly: boolean, Cb: SQLiteCb<T>): void;
		_db: Database
	},
	// open:boolean
}
export function getDatabase(name: string) {
	// eslint-disable-next-line new-cap, @typescript-eslint/no-unsafe-call
	const db = new SQLite(name, 1, name, 1) as IWebSQLDatabase
	if (!('_db' in db) || !db?._db) { return db as WebSQLDatabase }
	db.exec = <T>(queries: Query[], readOnly: boolean, Cb: SQLiteCb<T>) =>
		db?._db?.exec<T>(queries, readOnly, Cb)
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	db.close = () => new Promise<void>((resolve, reject) => {
		db?._db?._db.close(err => {
			if (err) { reject(err) }
			resolve()
		})
	})
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	db.closeAsync = () => new Promise<void>((resolve, reject) => {
		db?._db?._db.close(err => {
			if (err) { reject(err) }
			resolve()
		})
	})
	return db as WebSQLDatabase
}

