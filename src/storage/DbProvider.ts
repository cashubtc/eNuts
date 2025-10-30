import * as SQLite from "expo-sqlite";
import Storage from "expo-sqlite/kv-store";

/**
 * Provider for an Expo SQLite database.
 * - Lazily opens the database on first access
 * - Exposes methods to close and delete the database (useful for tests)
 */
class DbProvider {
  private readonly dbName: string;
  private database: SQLite.SQLiteDatabase | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  /**
   * Returns the SQLite database, opening it if needed.
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.database) {
      this.database = SQLite.openDatabaseSync(this.dbName);
    }
    return this.database;
  }

  public getFingerprint(): string | null {
    const fingerprint = Storage.getItemSync("coco_fingerprint");
    return fingerprint;
  }

  public setFingerprint(fingerprint: string): void {
    Storage.setItemSync("coco_fingerprint", fingerprint);
  }

  /**
   * Whether the database is currently open.
   */
  public isOpen(): boolean {
    return this.database != null;
  }

  /**
   * Close the database if open.
   */
  public async close(): Promise<void> {
    if (!this.database) return;
    try {
      await this.database.closeAsync();
    } catch (e) {
      console.log(e);
      try {
        this.database.closeSync?.();
      } catch {
        // ignore
      }
    } finally {
      this.database = null;
    }
  }

  /**
   * Delete the database file. Ensures the database is closed first.
   * Returns true on success.
   */
  public async delete(): Promise<void> {
    await this.close();
    try {
      SQLite.deleteDatabaseSync(this.dbName);
    } catch (e) {
      console.log(e);
      console.log("Error deleting database", this.dbName);
      // ignore
    }
  }
}
const dbProvider = new DbProvider("coco.db");
export { dbProvider };
export default dbProvider;
