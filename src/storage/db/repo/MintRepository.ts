import { db } from "../database";
import { SQLiteDB } from "../Db";
import { MintInfo } from "@src/wallet/types";

// Database row type (snake_case - matches table structure)
interface KnownMintRow {
    mint_url: string;
    name: string;
    mint_info: string; // JSON string
    created_at: number;
    updated_at: number;
}

// Domain type (camelCase - for use in codebase)
export interface KnownMint {
    mintUrl: string;
    name: string;
    mintInfo: MintInfo;
    createdAt: number;
    updatedAt: number;
}

// Mapper functions
const mapRowToDomain = (row: KnownMintRow): KnownMint => ({
    mintUrl: row.mint_url,
    name: row.name,
    mintInfo: JSON.parse(row.mint_info),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export class MintRepository {
    constructor(private database: SQLiteDB) {}

    async saveKnownMint(mintUrl: string, mintInfo: MintInfo): Promise<boolean> {
        const sql = `
            INSERT OR REPLACE INTO known_mints (mint_url, name, mint_info, updated_at) 
            VALUES (?, ?, ?, cast(strftime('%s','now') as INTEGER))
        `;
        const params = [
            mintUrl,
            mintInfo.name || "Unknown Mint",
            JSON.stringify(mintInfo),
        ];
        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async getKnownMint(mintUrl: string): Promise<KnownMint | null> {
        const sql = "SELECT * FROM known_mints WHERE mint_url = ?";
        const result = await this.database.first<KnownMintRow>(sql, [mintUrl]);

        if (!result) return null;

        return mapRowToDomain(result);
    }

    async getAllKnownMints(): Promise<KnownMint[]> {
        const sql = "SELECT * FROM known_mints ORDER BY name";
        const results = await this.database.all<KnownMintRow>(sql);

        return results.map(mapRowToDomain);
    }

    async deleteKnownMint(mintUrl: string): Promise<boolean> {
        const sql = "DELETE FROM known_mints WHERE mint_url = ?";
        const result = await this.database.run(sql, [mintUrl]);
        return result?.changes === 1;
    }

    async findKnownMintsByName(namePattern: string): Promise<KnownMint[]> {
        const sql = "SELECT * FROM known_mints WHERE name LIKE ? ORDER BY name";
        const results = await this.database.all<KnownMintRow>(sql, [
            `%${namePattern}%`,
        ]);

        return results.map(mapRowToDomain);
    }

    async getKnownMintsCount(): Promise<number> {
        const sql = "SELECT COUNT(*) as count FROM known_mints";
        const result = await this.database.first<{ count: number }>(sql);
        return result?.count || 0;
    }
}

export const mintRepository = new MintRepository(db);
