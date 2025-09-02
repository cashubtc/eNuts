// Database row type (snake_case - matches table structure)
interface ProofRow {
    mint_url: string;
    id: string;
    C: string;
    amount: number;
    secret: string;
    dleq: string | null; // JSON string
    state: string;
}

// Domain type (camelCase - for use in codebase)
export type EnutsProof = {
    mintUrl: string;
    state: "ready" | "inflight" | "used";
} & Proof;

import { Proof } from "@cashu/cashu-ts";
import { db } from "../database";
import { SQLiteDB } from "../Db";

// Mapper functions
const mapRowToDomain = (row: ProofRow): EnutsProof => ({
    mintUrl: row.mint_url,
    id: row.id,
    C: row.C,
    amount: row.amount,
    secret: row.secret,
    dleq: row.dleq ? JSON.parse(row.dleq) : undefined,
    state: row.state as "ready" | "inflight" | "used",
});

const mapDomainToRow = (proof: Partial<EnutsProof>): Partial<ProofRow> => ({
    mint_url: proof.mintUrl,
    id: proof.id,
    C: proof.C,
    amount: proof.amount,
    secret: proof.secret,
    dleq: proof.dleq ? JSON.stringify(proof.dleq) : null,
    state: proof.state,
});

export class ProofRepository {
    constructor(private database: SQLiteDB) {}

    async saveProof(proof: EnutsProof): Promise<boolean> {
        const sql = `
            INSERT OR REPLACE INTO proofs (mint_url, id, C, amount, secret, dleq, state) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            proof.mintUrl,
            proof.id,
            proof.C,
            proof.amount,
            proof.secret,
            proof.dleq ? JSON.stringify(proof.dleq) : null,
            proof.state,
        ];
        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async saveProofs(proofs: EnutsProof[]): Promise<boolean> {
        if (proofs.length === 0) return true;

        await this.database.db.withTransactionAsync(async () => {
            const sql = `
                INSERT OR REPLACE INTO proofs (mint_url, id, C, amount, secret, dleq, state) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            for (const proof of proofs) {
                const params = [
                    proof.mintUrl,
                    proof.id,
                    proof.C,
                    proof.amount,
                    proof.secret,
                    proof.dleq ? JSON.stringify(proof.dleq) : null,
                    proof.state,
                ];
                await this.database.db.runAsync(sql, params);
            }
        });
        return true;
    }

    async getProof(secret: string): Promise<EnutsProof | null> {
        const sql = "SELECT * FROM proofs WHERE secret = ?";
        const result = await this.database.first<ProofRow>(sql, [secret]);

        if (!result) return null;

        return mapRowToDomain(result);
    }

    async getProofsByMintUrl(mintUrl: string): Promise<EnutsProof[]> {
        const sql = "SELECT * FROM proofs WHERE mint_url = ?";
        const results = await this.database.all<ProofRow>(sql, [mintUrl]);

        return results.map(mapRowToDomain);
    }

    async getAllProofs(): Promise<EnutsProof[]> {
        const sql = "SELECT * FROM proofs";
        const results = await this.database.all<ProofRow>(sql);

        return results.map(mapRowToDomain);
    }

    async getProofsByState(state: EnutsProof["state"]): Promise<EnutsProof[]> {
        const sql = "SELECT * FROM proofs WHERE state = ?";
        const results = await this.database.all<ProofRow>(sql, [state]);

        return results.map(mapRowToDomain);
    }

    async getProofsByKeysetId(keysetId: string): Promise<EnutsProof[]> {
        const sql = "SELECT * FROM proofs WHERE id = ?";
        const results = await this.database.all<ProofRow>(sql, [keysetId]);

        return results.map(mapRowToDomain);
    }

    async deleteProof(secret: string): Promise<boolean> {
        const sql = "DELETE FROM proofs WHERE secret = ?";
        const result = await this.database.run(sql, [secret]);
        return result?.changes === 1;
    }

    async deleteProofsBySecrets(secrets: string[]): Promise<boolean> {
        if (secrets.length === 0) return true;
        const placeholders = secrets.map(() => "?").join(",");
        const sql = `DELETE FROM proofs WHERE secret IN (${placeholders})`;
        const result = await this.database.run(sql, secrets);
        return result?.changes === secrets.length;
    }

    async deleteProofsByMintUrl(mintUrl: string): Promise<boolean> {
        const sql = "DELETE FROM proofs WHERE mint_url = ?";
        const result = await this.database.run(sql, [mintUrl]);
        return result?.changes >= 1;
    }

    async updateProof(
        secret: string,
        updates: Partial<Proof>
    ): Promise<boolean> {
        const rowUpdates = mapDomainToRow(updates);
        const fields = Object.keys(rowUpdates).filter(
            (key) => rowUpdates[key as keyof ProofRow] !== undefined
        );

        if (fields.length === 0) return false;

        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const sql = `UPDATE proofs SET ${setClause} WHERE secret = ?`;
        const params = [
            ...fields
                .map((field) => rowUpdates[field as keyof ProofRow])
                .filter((val) => val !== undefined),
            secret,
        ];

        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async updateProofsState(
        secrets: string[],
        state: EnutsProof["state"]
    ): Promise<boolean> {
        if (secrets.length === 0) return true;

        const placeholders = secrets.map(() => "?").join(",");
        const sql = `UPDATE proofs SET state = ? WHERE secret IN (${placeholders})`;
        const params = [state, ...secrets];

        const result = await this.database.run(sql, params);
        return result?.changes === secrets.length;
    }

    async getProofsCount(): Promise<number> {
        const sql = "SELECT COUNT(*) as count FROM proofs";
        const result = await this.database.first<{ count: number }>(sql);
        return result?.count || 0;
    }

    async getReadyProofsAmount(mintUrl?: string): Promise<number> {
        let sql: string;
        const params: (string | number)[] = ["ready"];

        if (mintUrl) {
            sql =
                "SELECT SUM(amount) as total FROM proofs WHERE state = ? AND mint_url = ?";
            params.push(mintUrl);
        } else {
            sql = "SELECT SUM(amount) as total FROM proofs WHERE state = ?";
        }

        const result = await this.database.first<{ total: number }>(
            sql,
            params
        );
        return result?.total || 0;
    }
}

export const proofRepository = new ProofRepository(db);
