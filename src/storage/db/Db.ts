
import type { ITx, QueryArgs } from '@model'
import { isFunc, isObj, isStr, sleep } from '@util'
import type {
	Query,
	ResultSet,
	ResultSetErr,
	SQLiteCb,
	SQLResultSet,
	SQLStmtCb,
	SQLStmtErrCb,
	SQLTxErrCb,
	WebSQLDatabase
} from 'expo-sqlite/legacy'

function isWebSQLDatabase(v: unknown): v is WebSQLDatabase {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (!isObj(v) || !isFunc((v as any)?.transaction)) { return false }
	return true
}
type ExecResult<T> = ResultSetErr | ResultSet<T> | undefined
export class Db {
	public db: WebSQLDatabase
	public constructor(db: WebSQLDatabase)
	// public constructor(
	// 	openDbFn: IOpenDB,
	// 	{
	// 		name,
	// 		// version = '1.0',
	// 		// description = name,
	// 		// size = 1,
	// 		callback
	// 	}: IOpenDBParams
	// )
	public constructor(...args: unknown[]) {
		if (args.length === 1 && isWebSQLDatabase(args[0])) {
			this.db = args[0]
			return
		}
		// if (args.length === 2 && isFunc(args[0])) {
		// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		// 	this.db = args[0](args[1] as IOpenDBParams)
		// 	return
		// }
		throw new Error('Db constructor error')
	}
	public static async reset(db: Db, newDB: WebSQLDatabase) {
		// eslint-disable-next-line @typescript-eslint/await-thenable
		db.close()
		await sleep(1000)
		db.db = newDB
	}
	public reset(newDB: WebSQLDatabase) {
		return Db.reset(this, newDB)
	}
	public static close(db: WebSQLDatabase) {
		if (typeof db?.close === 'function') {
			db.close()
			return
		}
		if (typeof db?.closeAsync === 'function') {
			db.closeAsync()
			return
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (typeof (db as any)?._db?._db?.close === 'function') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			(db as any)._db._db.close()
		}
	}
	public close() { return Db.close(this.db) }
	public static async delete(db: WebSQLDatabase) {
		Db.close(db)
		await sleep(1000)
		if (typeof db?.delete === 'function') {
			db.delete()
			return
		}
		if (typeof db?.deleteAsync === 'function') {
			await db.deleteAsync()
			return
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (typeof (db as any)?._db?._db?.delete === 'function') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			(db as any)._db._db.delete()
		}
	}
	public delete() {
		return Db.delete(this.db)
	}
	public static execSync<T>(
		db: WebSQLDatabase,
		cmd: Query,
		readOnly = false,
		cb: SQLiteCb<T>
	) { return Db.execManySync<T>(db, [cmd], readOnly, cb) }
	public execSync<T>(
		cmd: Query,
		readOnly = false,
		cb: SQLiteCb<T>
	) { return Db.execSync<T>(this.db, cmd, readOnly, cb) }
	public static execManySync<T>(
		db: WebSQLDatabase,
		cmds: Query[],
		readOnly = false,
		cb: SQLiteCb<T>
	) { return db.exec<T>(cmds, readOnly, cb) }
	public execManySync<T>(
		cmds: Query[],
		readOnly = false,
		cb: SQLiteCb<T>
	) { return Db.execManySync<T>(this.db, cmds, readOnly, cb) }


	public static async exec<T>(
		db: WebSQLDatabase,
		cmd: Query,
		readOnly = false
	) {
		return (await Db.execMany<T>(db, [cmd], readOnly))?.[0]
	}
	public exec<T>(
		cmd: Query,
		readOnly = false
	) {
		return Db.exec<T>(this.db, cmd, readOnly)
	}
	public static execMany<T>(
		db: WebSQLDatabase,
		cmd: Query[],
		readOnly = false
	) {
		return new Promise<ExecResult<T>[] | undefined>((resolve, reject) => {
			db.exec<T>(cmd, readOnly, (err, result) => {
				if (err) { reject(err) }
				resolve(result)
			})
		})
	}
	public execMany<T>(
		cmd: Query[],
		readOnly = false
	) {
		return Db.execMany<T>(this.db, cmd, readOnly)
	}

	public static async execTx<T>(
		db: WebSQLDatabase,
		cmd: ITx<T>,
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>>
	public static async execTx<T>(
		db: WebSQLDatabase,
		sql: string,
		params?: QueryArgs,
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>>
	public static async execTx<T>(...args: unknown[]): Promise<SQLResultSet<T>> {
		const db = args[0] as WebSQLDatabase
		const cmd: ITx<T> = { sql: '', args: [] }
		let errorCb: SQLTxErrCb | undefined
		let successCb: (() => void) | undefined
		if (isObj(args[1])) {
			const { sql, args: params } = args[1] as ITx<T>
			cmd.sql = sql
			cmd.args = params as QueryArgs
			errorCb = args[2] as SQLTxErrCb
			successCb = args[3] as (() => void)
		} else if (isStr(args[1])) {
			cmd.sql = args[1]
			cmd.args = args[2] as QueryArgs
			errorCb = args[3] as SQLTxErrCb
			successCb = args[4] as (() => void)
		} else {
			errorCb = args[2] as SQLTxErrCb
			successCb = args[3] as (() => void)
		}
		return (await Db.execTxs<T>(db, [cmd], errorCb, successCb))[0]
	}
	public execTx<T>(
		sql: string,
		params?: QueryArgs,
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>>
	public execTx<T>(
		cmd: ITx<T>,
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>>
	public execTx<T>(...args: unknown[]): Promise<SQLResultSet<T>> {
		const cmd: ITx<T> = { sql: '', args: [] }
		let errorCb: SQLTxErrCb | undefined
		let successCb: (() => void) | undefined
		if (isObj(args[0])) {
			const { sql, args: params } = args[0] as ITx<T>
			cmd.sql = sql
			cmd.args = params as QueryArgs
			errorCb = args[1] as SQLTxErrCb
			successCb = args[2] as (() => void)
		} else if (isStr(args[0])) {
			cmd.sql = args[0]
			cmd.args = args[1] as QueryArgs
			errorCb = args[2] as SQLTxErrCb
			successCb = args[3] as (() => void)
		} else {
			errorCb = args[1] as SQLTxErrCb
			successCb = args[2] as (() => void)
		}
		return Db.execTx<T>(this.db, cmd, errorCb, successCb)
	}
	public static execTxs<T>(
		db: WebSQLDatabase,
		cmds: ITx<T>[],
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>[]> {
		const endResult: SQLResultSet<T>[] = []
		return new Promise<SQLResultSet<T>[]>((resolve, reject) =>
			db.transaction(tx => {
				cmds.forEach(({ sql: sqlStmt, args, cb, errorCb }) => {
					tx.executeSql<T>(sqlStmt, args, (tx, result) => {
						// TODO provide types to satisfy TS
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						cb?.(tx, result)
						endResult.push(result)
						// l({result,sqlStmt,args})
					}, (tx, error) => {
						// l({error,tx})
						// TODO provide types to satisfy TS
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						errorCb?.(tx, error)
						return true
					})
				})
			}, err => {
				errorCb?.(err)
				reject(err)
			}, () => {
				successCb?.()
				resolve(endResult)
			})
		)
	}
	public execTxs<T>(
		cmds: ITx<T>[],
		errorCb?: SQLTxErrCb,
		successCb?: (() => void)
	): Promise<SQLResultSet<T>[]> { return Db.execTxs<T>(this.db, cmds, errorCb, successCb) }
	/* 	static #execTxs<T>(
			db: WebSQLDatabase,
			cmds: ITx<T>[],
			errorCb?: SQLTxErrCb,
			successCb?: (() => void)
		) {
			const endResult: SQLResultSet<T>[] = []
			return new Promise<SQLResultSet<T>[]>((resolve, reject) =>
				db.transaction(tx => {
					cmds.forEach(({ sql: sqlStmt, args, cb, errorCb }) => {
						tx.executeSql<T>(
							sqlStmt,
							args,
							(tx, result) => {
								cb?.(tx, result)
								endResult.push(result)
							},
							(tx, error) => {
								errorCb?.(tx, error)
								return true
							}
						)
					})
				},
				err => {
					errorCb?.(err)
					reject(err)
				},
				() => {
					successCb?.()
					resolve(endResult)
				})
			)
		}
		static async #execTx<T>(
			db: WebSQLDatabase,
			cmd: ITx<T>,
			errorCb?: SQLTxErrCb,
			successCb?: (() => void)
		) {
			const result = await Db.#execTxs<T>(db, [cmd], errorCb, successCb)
			return result?.[0]
		} */
	public static execReadTx<T>(
		db: WebSQLDatabase,
		sql: string,
		params: QueryArgs = [],
		cb?: SQLStmtCb<T>,
		errorCb?: SQLStmtErrCb
	) {
		return new Promise<SQLResultSet<T>>(
			(resolve, reject) => db.readTransaction((tx) => {
				tx.executeSql<T>(
					sql,
					params,
					(_tx, result) => {
						cb?.(_tx, result)
						resolve(result)
					},
					(_tx, error) => {
						errorCb?.(_tx, error)
						reject(error)
						return !!error
					}
				)
			})
		)
	}
	public execReadTx<T>(
		sql: string,
		params: QueryArgs = [],
		cb?: SQLStmtCb<T>,
		errorCb?: SQLStmtErrCb
	) {
		return Db.execReadTx<T>(this.db, sql, params, cb, errorCb)
	}

	public execSelect<T>(sql: string, params: QueryArgs = []) {
		return Db.execSelect<T>(this.db, sql, params)
	}
	public static async execSelect<T>(db: WebSQLDatabase, sql: string, params: QueryArgs = []) {
		const result = await Db.execReadTx<T>(db, sql, params)
		return result.rows
	}


	public execInsert<T>(sql: string, params: QueryArgs = []) {
		return Db.execInsert<T>(this.db, sql, params)
	}
	public static async execInsert<T>(db: WebSQLDatabase, sql: string, params: QueryArgs = []) {
		const result/* : Omit<SQLResultSet<T>, 'rows'> */ = await Db.execTx<T>(db, sql, params)
		return result
	}


	public get<T>(sql: string, params: QueryArgs = []) {
		return Db.get<T>(this.db, sql, params)
	}
	public static async get<T>(db: WebSQLDatabase, sql: string, params: QueryArgs = []) {
		const result = await Db.execSelect<T>(db, sql, params)
		return result?.item?.(0)
	}
	public all<T>(sql: string, params: QueryArgs = []) {
		return Db.all<T>(this.db, sql, params)
	}
	public static async all<T>(db: WebSQLDatabase, sql: string, params: QueryArgs = []) {
		const result = await Db.execSelect<T>(db, sql, params)
		return result._array
	}


	/*public insertMany<T extends object>(table: string, params: T[]) {
	   return Db.insertMany(this.db, table, params)
   }
   public static async insertMany<T extends object>(db: WebSQLDatabase, table: string, params: T[]) {
	   const keys = Object.keys(params[0])
	   l('[insertMany]', table, keys)
	   const vals = params.map(_ => `(${keys.map(_ => '?').join(', ')})`).join(', ')
	   const sqlPrefix = `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES `
	   const sql = sqlPrefix + vals
	   l('[insertMany]', sql, params)
	   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	   const args: QueryArgs = params
		   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
		   .flatMap(p => Object.values(p)
			   // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			   .map(x => typeof x === 'number' ? x : x.toString()))

	   const result = await this.execInsert(db, sql, args)
	   l('[insertMany]', result, params)
	   return result
   }*/

}
