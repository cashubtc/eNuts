import * as SQLite from 'expo-sqlite'

export class SQLiteDB {
	public db: SQLite.SQLiteDatabase
	private dbName: string
	constructor(dbName: string) {
		this.dbName = dbName
		this.db = SQLite.openDatabaseSync(dbName)
	}

	public async close() {
		await this.db.closeAsync()
	}

	public async reset() {
		await this.db.closeAsync()
		this.db = SQLite.openDatabaseSync(this.dbName)
	}

	/**
	 * Execute all SQL queries in the supplied string.
	 * Note: The queries are not escaped for you! Be careful when constructing your queries.
	 * @param sql — A string containing all the SQL queries.
	 */
	public async exec(sql: string) {
		await this.db.execAsync(sql)
	}

	public async run(sql: string, params: SQLite.SQLiteVariadicBindParams = []) {
		const result = await this.db.runAsync(sql, params)
		return result
	}

	public async first<T>(sql: string, params: SQLite.SQLiteVariadicBindParams = []) {
		const result = await this.db.getFirstAsync<T>(sql, params)
		return result
	}

	public async all<T>(sql: string, params: SQLite.SQLiteVariadicBindParams = []) {
		const result = await this.db.getAllAsync<T>(sql, params)
		return result
	}
}
