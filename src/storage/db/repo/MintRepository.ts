import { db } from "../database";
import { SQLiteDB } from "../Db";
import { MintInfo } from "@src/wallet/types";

// Database row type (snake_case - matches table structure)
interface MintRow {
  mint_url: string;
  name: string;
  mint_info: string; // JSON string
  created_at: number;
  updated_at: number;
}

// Domain type (camelCase - for use in codebase)
export interface Mint {
  mintUrl: string;
  name: string;
  mintInfo: MintInfo;
  createdAt: number;
  updatedAt: number;
}

// Mapper functions
const mapRowToDomain = (row: MintRow): Mint => ({
  mintUrl: row.mint_url,
  name: row.name,
  mintInfo: JSON.parse(row.mint_info),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class MintRepository {
  constructor(private database: SQLiteDB) {}

  /**
   * Saves a new mint to the database. Fails if mint already exists.
   */
  async saveMint(mintUrl: string, mintInfo: MintInfo): Promise<boolean> {
    const sql = `
            INSERT INTO known_mints (mint_url, name, mint_info, created_at, updated_at) 
            VALUES (?, ?, ?, cast(strftime('%s','now') as INTEGER), cast(strftime('%s','now') as INTEGER))
        `;
    const params = [
      mintUrl,
      mintInfo.name || "Unknown Mint",
      JSON.stringify(mintInfo),
    ];
    try {
      const result = await this.database.run(sql, params);
      return result?.changes === 1;
    } catch (error) {
      // SQLite constraint violation (mint already exists)
      return false;
    }
  }

  /**
   * Legacy method for backward compatibility - uses upsert logic
   * @deprecated Use saveMint() for new mints or updateMint() for updates
   */
  async saveKnownMint(mintUrl: string, mintInfo: MintInfo): Promise<boolean> {
    const existing = await this.getMint(mintUrl);
    if (existing) {
      return await this.updateMint(mintUrl, {
        mintInfo,
        name: mintInfo.name || "Unknown Mint",
      });
    } else {
      return await this.saveMint(mintUrl, mintInfo);
    }
  }

  async getMint(mintUrl: string): Promise<Mint | null> {
    const sql = "SELECT * FROM known_mints WHERE mint_url = ?";
    const result = await this.database.first<MintRow>(sql, [mintUrl]);

    if (!result) return null;

    return mapRowToDomain(result);
  }

  async getAllMints(): Promise<Mint[]> {
    const sql = "SELECT * FROM known_mints ORDER BY name";
    const results = await this.database.all<MintRow>(sql);

    return results.map(mapRowToDomain);
  }

  async deleteMint(mintUrl: string): Promise<boolean> {
    const sql = "DELETE FROM known_mints WHERE mint_url = ?";
    const result = await this.database.run(sql, [mintUrl]);
    return result?.changes === 1;
  }

  async findMintsByName(namePattern: string): Promise<Mint[]> {
    const sql = "SELECT * FROM known_mints WHERE name LIKE ? ORDER BY name";
    const results = await this.database.all<MintRow>(sql, [`%${namePattern}%`]);

    return results.map(mapRowToDomain);
  }

  async getMintsCount(): Promise<number> {
    const sql = "SELECT COUNT(*) as count FROM known_mints";
    const result = await this.database.first<{ count: number }>(sql);
    return result?.count || 0;
  }

  async updateMint(mintUrl: string, updates: Partial<Mint>): Promise<boolean> {
    const current = await this.getMint(mintUrl);
    if (!current) {
      return false;
    }

    const updated = { ...current, ...updates };
    const sql = `
            UPDATE known_mints 
            SET name = ?, mint_info = ?, updated_at = cast(strftime('%s','now') as INTEGER)
            WHERE mint_url = ?
        `;
    const params = [updated.name, JSON.stringify(updated.mintInfo), mintUrl];
    const result = await this.database.run(sql, params);
    return result?.changes === 1;
  }
}

export const mintRepository = new MintRepository(db);
