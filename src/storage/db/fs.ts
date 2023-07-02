// import * as Asset from 'expo-asset'
import { l } from '@log'
import * as FileSystem from 'expo-file-system'
import * as SQLite from 'expo-sqlite'

export async function fsInfo() {
	l(FileSystem.documentDirectory)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	l('documentDirectory', await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!))
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	l('cacheDirectory', await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory!))
	l('sqlite', await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}SQLite`))
	if (FileSystem.bundledAssets) {
		l('Assets', await FileSystem.readDirectoryAsync(FileSystem.bundledAssets))
	}
	l('db from assets', await openDatabase('myDatabaseName.db'))
}
/**/
export async function openDatabase(_pathToDatabaseFile: string): Promise<SQLite.WebSQLDatabase> {
	const path = `${FileSystem.documentDirectory}SQLite`
	if (!(await FileSystem.getInfoAsync(path)).exists) {
		await FileSystem.makeDirectoryAsync(path)
	}
	//l(Asset.Asset.fromModule(await import(pathToDatabaseFile)))
	/* await FileSystem.downloadAsync(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires
		Asset.Asset.fromModule((pathToDatabaseFile)).uri,
		`${path}myDatabaseName.db`
	) */
	return SQLite.openDatabase('../../assets/myDatabaseName.db')
}
