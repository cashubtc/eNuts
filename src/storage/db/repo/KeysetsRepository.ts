import { db } from "../database";
import { SQLiteDB } from "../Db";

// Database row type (snake_case - matches table structure)
interface KeysetRow {
  mint_url: string;
  id: string;
  keypairs: string; // JSON string
  active: boolean;
  counter: number;
  fee_ppk: number;
  updated_at: number;
}

// Domain type (camelCase - for use in codebase)
export interface Keyset {
  mintUrl: string;
  id: string;
  keypairs: Record<number, string>; // JSON string
  active: boolean;
  counter: number;
  feePpk: number;
  updatedAt: number;
}

// Mapper functions
const mapRowToDomain = (row: KeysetRow): Keyset => ({
  mintUrl: row.mint_url,
  id: row.id,
  keypairs: JSON.parse(row.keypairs),
  active: row.active,
  counter: row.counter,
  feePpk: row.fee_ppk,
  updatedAt: row.updated_at,
});

const mapDomainToRow = (keyset: Partial<Keyset>): Partial<KeysetRow> => ({
  mint_url: keyset.mintUrl,
  id: keyset.id,
  keypairs: keyset.keypairs ? JSON.stringify(keyset.keypairs) : undefined,
  active: keyset.active,
  fee_ppk: keyset.feePpk,
  updated_at: keyset.updatedAt,
});

export class KeysetRepository {
  constructor(private database: SQLiteDB) {}

  /**
   * Saves a new keyset to the database. Fails if keyset already exists.
   */
  async saveKeyset(keyset: Omit<Keyset, "updatedAt">): Promise<boolean> {
    const sql = `
            INSERT INTO keyset_ids (mint_url, id, keypairs, active, counter, fee_ppk, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, cast(strftime('%s','now') as INTEGER))
        `;
    const params = [
      keyset.mintUrl,
      keyset.id,
      JSON.stringify(keyset.keypairs),
      keyset.active,
      keyset.counter,
      keyset.feePpk,
    ];
    try {
      const result = await this.database.run(sql, params);
      return result?.changes === 1;
    } catch (error) {
      // SQLite constraint violation (keyset already exists)
      return false;
    }
  }

  /**
   * Legacy method for backward compatibility - uses upsert logic
   * @deprecated Use saveKeyset() for new keysets or updateKeyset() for updates
   */
  async upsertKeyset(keyset: Omit<Keyset, "updatedAt">): Promise<boolean> {
    const sql = `
            INSERT OR REPLACE INTO keyset_ids (mint_url, id, keypairs, active, counter, fee_ppk, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, cast(strftime('%s','now') as INTEGER))
        `;
    const params = [
      keyset.mintUrl,
      keyset.id,
      JSON.stringify(keyset.keypairs),
      keyset.active,
      keyset.counter,
      keyset.feePpk,
    ];
    const result = await this.database.run(sql, params);
    return result?.changes === 1;
  }

  async getKeyset(id: string): Promise<Keyset | null> {
    const sql = "SELECT * FROM keyset_ids WHERE id = ?";
    const result = await this.database.first<KeysetRow>(sql, [id]);

    if (!result) return null;

    return mapRowToDomain(result);
  }

  async getKeysetsByMintUrl(mintUrl: string): Promise<Keyset[]> {
    const sql = "SELECT * FROM keyset_ids WHERE mint_url = ? ORDER BY id";
    const results = await this.database.all<KeysetRow>(sql, [mintUrl]);

    return results.map(mapRowToDomain);
  }

  async getAllKeysets(): Promise<Keyset[]> {
    const sql = "SELECT * FROM keyset_ids ORDER BY mint_url, id";
    const results = await this.database.all<KeysetRow>(sql);

    return results.map(mapRowToDomain);
  }

  async deleteKeyset(id: string): Promise<boolean> {
    const sql = "DELETE FROM keyset_ids WHERE id = ?";
    const result = await this.database.run(sql, [id]);
    return result?.changes === 1;
  }

  async deleteKeysetsByMintUrl(mintUrl: string): Promise<boolean> {
    const sql = "DELETE FROM keyset_ids WHERE mint_url = ?";
    const result = await this.database.run(sql, [mintUrl]);
    return result?.changes >= 1;
  }

  async updateKeyset(id: string, updates: Partial<Keyset>): Promise<boolean> {
    const rowUpdates = mapDomainToRow(updates);
    const fields = Object.keys(rowUpdates).filter(
      (key) => rowUpdates[key as keyof KeysetRow] !== undefined
    );

    if (fields.length === 0) return false;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const sql = `UPDATE keyset_ids SET ${setClause}, updated_at = cast(strftime('%s','now') as INTEGER) WHERE id = ?`;
    const params = [
      ...fields
        .map((field) => rowUpdates[field as keyof KeysetRow])
        .filter((val) => val !== undefined),
      id,
    ];

    const result = await this.database.run(sql, params);
    return result?.changes === 1;
  }

  async getKeysetsCount(): Promise<number> {
    const sql = "SELECT COUNT(*) as count FROM keyset_ids";
    const result = await this.database.first<{ count: number }>(sql);
    return result?.count || 0;
  }

  async getActiveKeysets(): Promise<Keyset[]> {
    const sql =
      "SELECT * FROM keyset_ids WHERE active = 1 ORDER BY mint_url, id";
    const results = await this.database.all<KeysetRow>(sql);

    return results.map(mapRowToDomain);
  }

  /**
   * Saves or updates a keyset while preserving the existing counter value
   * If the keyset doesn't exist, it will be created with the provided counter value
   * If it exists, only non-counter fields will be updated
   */
  async upsertKeysetPreservingCounter(
    keyset: Omit<Keyset, "updatedAt">
  ): Promise<boolean> {
    // Try to save as new keyset first
    const saved = await this.saveKeyset(keyset);
    if (saved) {
      return true; // Successfully created new keyset
    }

    // If save failed (keyset exists), update existing keyset but preserve counter
    return await this.updateKeyset(keyset.id, {
      keypairs: keyset.keypairs,
      active: keyset.active,
      feePpk: keyset.feePpk,
      // Explicitly do not update counter
    });
  }
}

export const keysetRepository = new KeysetRepository(db);
