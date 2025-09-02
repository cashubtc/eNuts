import { Token } from "@cashu/cashu-ts";
import { db } from "../database";
import { SQLiteDB } from "../Db";

// Database row type (snake_case - matches table structure)
interface HistoryRow {
    id: number;
    amount: number;
    type: HistoryEventData["type"];
    meta: string; // JSON string
    mints: string; // JSON string
    created_at: number;
}

export type HistoryEventBase = {
    id: number;
    amount: number;
    mints: string[];
    createdAt: number;
};

type HistoryAddEcash = { type: "addEcash"; meta: { token: Token } };
type HistorySendEcash = { type: "sendEcash"; meta: { token: Token } };
type HistoryAddLightning = {
    type: "addLightning";
    meta: { paymentRequest: string };
};
type HistorySendLightning = {
    type: "sendLightning";
    meta: { paymentRequest: string };
};
type HistorySwapEcash = { type: "swapEcash"; meta: { token: Token } };

type HistoryEventData =
    | HistoryAddEcash
    | HistorySendEcash
    | HistoryAddLightning
    | HistorySendLightning
    | HistorySwapEcash;
export type HistoryEvent = HistoryEventBase & HistoryEventData;

// Mapper functions
const mapRowToDomain = (row: HistoryRow): HistoryEvent =>
    ({
        id: row.id,
        amount: row.amount,
        mints: JSON.parse(row.mints),
        createdAt: row.created_at,
        type: row.type,
        meta: JSON.parse(row.meta),
    } as HistoryEvent);

const mapDomainToRow = (
    history: Partial<HistoryEvent>
): Partial<HistoryRow> => ({
    id: history.id,
    amount: history.amount,
    type: history.type,
    meta: history.meta ? JSON.stringify(history.meta) : "{}",
    mints: history.mints ? JSON.stringify(history.mints) : "[]",
    created_at: history.createdAt,
});

export class HistoryRepository {
    constructor(private database: SQLiteDB) {}

    async create(history: HistoryEvent): Promise<boolean> {
        const sql = `
            INSERT OR IGNORE INTO history (amount, type, meta, mints, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;
        const row = mapDomainToRow(history);
        const params = [
            row.amount || 0,
            row.type || history.type,
            row.meta || JSON.stringify(history.meta),
            row.mints || JSON.stringify(history.mints),
            row.created_at || Date.now(),
        ];
        const result = await this.database.run(sql, params);
        return result?.changes === 1;
    }

    async getAll(): Promise<HistoryEvent[]> {
        const sql = "SELECT * FROM history ORDER BY created_at DESC";
        const results = await this.database.all<HistoryRow>(sql);
        return results.map(mapRowToDomain);
    }

    async getPaginated(limit: number, offset: number): Promise<HistoryEvent[]> {
        const sql =
            "SELECT * FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?";
        const results = await this.database.all<HistoryRow>(sql, [
            limit,
            offset,
        ]);
        return results.map(mapRowToDomain);
    }

    async deleteAll(): Promise<boolean> {
        const sql = "DELETE FROM history";
        const result = await this.database.run(sql);
        return result?.changes > 0;
    }
}

export const historyRepository = new HistoryRepository(db);
