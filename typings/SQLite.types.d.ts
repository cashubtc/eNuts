/* global  */
declare module 'expo-sqlite/legacy' {


	// @docsMissing
	export type DatabaseCb = (database: Database) => void;

	// @needsAudit @docsMissing
	/**
	 * `Database` objects are returned by calls to `SQLite.openDatabase()`. Such an object represents a
	 * connection to a database on your device.
	 */
	export interface Database {
		version: string;
		// _db: any;
		/**
		 * Execute a database transaction.
		 * @param Cb A function representing the transaction to perform. Takes a Tx
		 * (see below) as its only parameter, on which it can add SQL statements to execute.
		 * @param errorCb Called if an error occurred processing this transaction. Takes a single
		 * parameter describing the error.
		 * @param successCb Called when the transaction has completed executing on the database.
		 */
		transaction(
			Cb: SQLTxCb,
			errorCb?: SQLTxErrCb,
			successCb?: () => void
		): void;

		/* readTx(
			Cb: SQLTxCb,
			errorCb?: SQLTxErrCb,
			successCb?: () => void
		): void; */
		readTransaction(
			Cb: SQLTxCb,
			errorCb?: SQLTxErrCb,
			successCb?: () => void
		): void;
	}

	// @docsMissing
	export type SQLTxCb = (transaction: SQLTx) => void;
	export type SQLTransactionCallback = SQLTxCb
	// @docsMissing
	export type SQLTxErrCb = (error: SQLErr) => void;
	export type SQLTransactionErrorCallback = SQLTxErrCb
	// @needsAudit
	/**
	 * A `SQLTx` object is passed in as a parameter to the `Cb` parameter for the
	 * `db.transaction()` method on a `Database` (see above). It allows enqueuing SQL statements to
	 * perform in a database transaction.
	 */
	export interface SQLTx {
		/**
		 * Enqueue a SQL statement to execute in the transaction. Authors are strongly recommended to make
		 * use of the `?` placeholder feature of the method to avoid against SQL injection attacks, and to
		 * never construct SQL statements on the fly.
		 * @param sqlStatement A string containing a database query to execute expressed as SQL. The string
		 * may contain `?` placeholders, with values to be substituted listed in the `arguments` parameter.
		 * @param args An array of values (numbers, strings or nulls) to substitute for `?` placeholders in the
		 * SQL statement.
		 * @param Cb Called when the query is successfully completed during the transaction. Takes
		 * two parameters: the transaction itself, and a `ResultSet` object (see below) with the results
		 * of the query.
		 * @param errorCb Called if an error occurred executing this particular query in the
		 * transaction. Takes two parameters: the transaction itself, and the error object.
		 */
		executeSql<T = unknown>(
			sqlStatement: string,
			args?: (number | string | null)[],
			Cb?: SQLStatementCb<T>,
			errorCb?: SQLStatementErrCb
		): void;
	}
	export type SQLTransaction = SQLTx
	// @docsMissing
	export type SQLStatementCb<T = unknown> = (transaction: SQLTx, resultSet: SQLResultSet<T>) => void;
	export type SQLStatementCallback<T = unknown> = SQLStatementCb<T>
	export type SQLStmtCb<T = unknown> = SQLStatementCb<T>
	// @docsMissing
	export type SQLStatementErrCb = (transaction: SQLTx, error: SQLErr) => boolean;
	export type SQLStatementErrorCallback = SQLStatementErrCb
	export type SQLStmtErrCb = SQLStatementErrCb

	// @needsAudit
	export interface SQLResultSet<T = unknown> {
		/**
		 * The row ID of the row that the SQL statement inserted into the database, if a row was inserted.
		 */
		insertId?: number;
		/**
		 * The number of rows that were changed by the SQL statement.
		 */
		rowsAffected: number;
		rows: SQLResultSetRowList<T>;
	}

	export interface SQLResultSetRowList<T = unknown> {
		/**
		 * The number of rows returned by the query.
		 */
		length: number;
		/**
		 * Returns the row with the given `index`. If there is no such row, returns `null`.
		 * @param index Index of row to get.
		 */
		item?: (index: number) => T | undefined | null;
		/**
		 * The actual array of rows returned by the query. Can be used directly instead of
		 * getting rows through rows.item().
		 */
		_array: T[];
	}



	// @docsMissing
	export interface WebSQLDatabase extends Database {
		exec<T = unknown>(queries: Query[], readOnly: boolean, Cb: SQLiteCb<T>): void;

		/**
		 * Close the database.
		 */
		closeAsync(): void;
		close(): void;

		/**
		 * Delete the database file.
		 * > The database has to be closed prior to deletion.
		 */
		deleteAsync(): Promise<void>;
		delete(): void;
	}

	// @docsMissing
	export interface Query { sql: string; args: (number | string | null)[] }

	// @docsMissing
	export interface ResultSetErr {
		error: Error;
	}

	// @needsAudit
	/**
	 * `ResultSet` objects are returned through second parameter of the `success` Cb for the
	 * `tx.executeSql()` method on a `SQLTx` (see above).
	 */
	export interface ResultSet<T = unknown> {
		/**
		 * The row ID of the row that the SQL statement inserted into the database, if a row was inserted.
		 */
		insertId?: number;
		/**
		 * The number of rows that were changed by the SQL statement.
		 */
		rowsAffected: number;
		rows: T[];
	}

	// @docsMissing
	export type SQLiteCb<T = unknown> = (
		error?: Error | null,
		resultSet?: (ResultSetErr | ResultSet<T>)[]
	) => void;
	export type SQLiteCallback<T = unknown> = SQLiteCb<T>
	export function openDatabase(
		name: string,
		version: string = '1.0',
		description: string = name,
		size: number = 1,
		callback?: (db: WebSQLDatabase) => void
	): WebSQLDatabase
}

//}