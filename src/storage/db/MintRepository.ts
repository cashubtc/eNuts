import { db } from "./database";
import { IMint, IKnownMint } from "@model";
import { SQLiteDB } from "./Db";
import { MintInfo } from "@src/wallet/types";
import { MintData } from "@src/model/mint";

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

    async getKnownMint(mintUrl: string): Promise<IKnownMint | null> {
        const sql = "SELECT * FROM known_mints WHERE mint_url = ?";
        const result = await this.database.first<{
            mint_url: string;
            name: string;
            mint_info: string;
            created_at: number;
            updated_at: number;
        }>(sql, [mintUrl]);

        if (!result) return null;

        return {
            mint_url: result.mint_url,
            name: result.name,
            mint_info: JSON.parse(result.mint_info),
            created_at: result.created_at,
            updated_at: result.updated_at,
        };
    }

    async getAllKnownMints(): Promise<IKnownMint[]> {
        const sql = "SELECT * FROM known_mints ORDER BY name";
        const results = await this.database.all<{
            mint_url: string;
            name: string;
            mint_info: string;
            created_at: number;
            updated_at: number;
        }>(sql);

        return results.map(
            (result: {
                mint_url: string;
                name: string;
                mint_info: string;
                created_at: number;
                updated_at: number;
            }) => ({
                mint_url: result.mint_url,
                name: result.name,
                mint_info: JSON.parse(result.mint_info),
                created_at: result.created_at,
                updated_at: result.updated_at,
            })
        );
    }

    async deleteKnownMint(mintUrl: string): Promise<boolean> {
        const sql = "DELETE FROM known_mints WHERE mint_url = ?";
        const result = await this.database.run(sql, [mintUrl]);
        return result?.changes === 1;
    }
}

export const mintRepository = new MintRepository(db);
