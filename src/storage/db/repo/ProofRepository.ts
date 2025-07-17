// Database row type (snake_case - matches table structure)
interface ProofRow {
    mint_url: string;
    id: string;
    C: string;
    amount: number;
    secret: string;
    dleq: string; // JSON string
    state: string;
}

// Domain type (camelCase - for use in codebase)
export interface Proof {
    mintUrl: string;
    id: string;
    C: string;
    amount: number;
    secret: string;
    dleq: string; // JSON string
    state: "ready" | "inflight" | "used";
}

import { db } from "../database";
import { SQLiteDB } from "../Db";

// Mapper functions
const mapRowToDomain = (row: ProofRow): Proof => ({
    mintUrl: row.mint_url,
    id: row.id,
    C: row.C,
    amount: row.amount,
    secret: row.secret,
    dleq: row.dleq,
    state: row.state as "ready" | "inflight" | "used",
});

const mapDomainToRow = (proof: Partial<Proof>): Partial<ProofRow> => ({
    mint_url: proof.mintUrl,
    id: proof.id,
    C: proof.C,
    amount: proof.amount,
    secret: proof.secret,
    dleq: proof.dleq,
    state: proof.state,
});

export class ProofRepository {
    constructor(private database: SQLiteDB) {}

    async saveProof(proof: Proof): Promise<boolean> {
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
            proof.dleq,
            proof.state,
        ];
        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async saveProofs(proofs: Proof[]): Promise<boolean> {
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
                    proof.dleq,
                    proof.state,
                ];
                await this.database.db.runAsync(sql, params);
            }
        });
        return true;
    }

    async getProof(id: string): Promise<Proof | null> {
        const sql = "SELECT * FROM proofs WHERE id = ?";
        const result = await this.database.first<ProofRow>(sql, [id]);

        if (!result) return null;

        return mapRowToDomain(result);
    }

    async getProofsByMintUrl(mintUrl: string): Promise<Proof[]> {
        const sql = "SELECT * FROM proofs WHERE mint_url = ?";
        const results = await this.database.all<ProofRow>(sql, [mintUrl]);

        return results.map(mapRowToDomain);
    }

    async getAllProofs(): Promise<Proof[]> {
        const sql = "SELECT * FROM proofs";
        const results = await this.database.all<ProofRow>(sql);

        return results.map(mapRowToDomain);
    }

    async getProofsByState(state: Proof["state"]): Promise<Proof[]> {
        const sql = "SELECT * FROM proofs WHERE state = ?";
        const results = await this.database.all<ProofRow>(sql, [state]);

        return results.map(mapRowToDomain);
    }

    async deleteProof(id: string): Promise<boolean> {
        const sql = "DELETE FROM proofs WHERE id = ?";
        const result = await this.database.run(sql, [id]);
        return result?.changes === 1;
    }

    async deleteProofsByIds(ids: string[]): Promise<boolean> {
        if (ids.length === 0) return true;
        const placeholders = ids.map(() => "?").join(",");
        const sql = `DELETE FROM proofs WHERE id IN (${placeholders})`;
        const result = await this.database.run(sql, ids);
        return result?.changes === ids.length;
    }

    async deleteProofsByMintUrl(mintUrl: string): Promise<boolean> {
        const sql = "DELETE FROM proofs WHERE mint_url = ?";
        const result = await this.database.run(sql, [mintUrl]);
        return result?.changes >= 1;
    }

    async updateProof(id: string, updates: Partial<Proof>): Promise<boolean> {
        const rowUpdates = mapDomainToRow(updates);
        const fields = Object.keys(rowUpdates).filter(
            (key) => rowUpdates[key as keyof ProofRow] !== undefined
        );

        if (fields.length === 0) return false;

        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const sql = `UPDATE proofs SET ${setClause} WHERE id = ?`;
        const params = [
            ...fields
                .map((field) => rowUpdates[field as keyof ProofRow])
                .filter((val) => val !== undefined),
            id,
        ];

        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async updateProofsState(
        ids: string[],
        state: Proof["state"]
    ): Promise<boolean> {
        if (ids.length === 0) return true;

        const placeholders = ids.map(() => "?").join(",");
        const sql = `UPDATE proofs SET state = ? WHERE id IN (${placeholders})`;
        const params = [state, ...ids];

        const result = await this.database.run(sql, params);
        return result?.changes === ids.length;
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
