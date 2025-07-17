import { l } from "@log";
import { db } from "./database";

// Migration interface
interface Migration {
    version: number;
    description: string;
    up: () => Promise<void>;
    down?: () => Promise<void>;
}

// Create the migrations table to track applied migrations
const createMigrationsTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at INTEGER DEFAULT (cast(strftime('%s','now') as INTEGER))
        )
    `;
    await db.exec(sql);
};

// Get the current database version
const getCurrentVersion = async (): Promise<number> => {
    try {
        const result = await db.first<{ version: number }>(
            "SELECT MAX(version) as version FROM migrations"
        );
        return result?.version || 0;
    } catch (error) {
        // If migrations table doesn't exist, return 0
        return 0;
    }
};

// Record a migration as applied
const recordMigration = async (version: number, description: string) => {
    await db.run(
        "INSERT INTO migrations (version, description) VALUES (?, ?)",
        [version, description]
    );
};

// Define all migrations
const migrations: Migration[] = [
    {
        version: 1,
        description: "Initial database schema",
        up: async () => {
            // Initial SQL configuration
            const initialSql = `
                PRAGMA cache_size=8192;
                PRAGMA encoding="UTF-8";
                PRAGMA synchronous=NORMAL;
                PRAGMA temp_store=FILE;
            `;
            await db.exec(initialSql);

            // Create all initial tables
            const createProofsTable = `
                CREATE TABLE IF NOT EXISTS proofs (
                    mint_url TEXT NOT NULL,
                    id TEXT NOT NULL,
                    C TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    secret TEXT PRIMARY KEY NOT NULL,
                    dleq TEXT,
                    state TEXT NOT NULL
                )
            `;

            const createProofsUsedTable = `
                CREATE TABLE IF NOT EXISTS proofsUsed (
                    id TEXT NOT NULL,
                    amount INT NOT NULL,
                    secret TEXT PRIMARY KEY NOT NULL,
                    C TEXT NOT NULL
                )
            `;

            const createKeysetIdsTable = `
                CREATE TABLE IF NOT EXISTS keyset_ids (
                    mint_url TEXT NOT NULL,
                    id TEXT PRIMARY KEY,
                    keypairs TEXT NOT NULL,
                    active Bool DEFAULT True,
                    counter INTEGER DEFAULT 0,
                    fee_ppk INTEGER DEFAULT 0,
                    updated_at INTEGER DEFAULT (cast(strftime('%s','now') as INTEGER)),
                    UNIQUE (id, mint_url)
                )
            `;

            const createInvoicesTable = `
                CREATE TABLE IF NOT EXISTS invoices (
                    amount INTEGER NOT NULL,
                    pr TEXT NOT NULL,
                    hash TEXT PRIMARY KEY,
                    time INTEGER DEFAULT (cast(strftime('%s','now') as INTEGER)),
                    mintUrl TEXT NOT NULL
                )
            `;

            const createPreferencesTable = `
                CREATE TABLE IF NOT EXISTS preferences (
                    id integer PRIMARY KEY,
                    formatBalance Bool NOT NULL,
                    darkmode Bool NOT NULL,
                    theme TEXT NOT NULL
                )
            `;

            const createContactsTable = `
                CREATE TABLE IF NOT EXISTS contacts (
                    id integer PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    ln TEXT NOT NULL UNIQUE,
                    isOwner Bool Default False
                )
            `;

            const createKnownMintsTable = `
                CREATE TABLE IF NOT EXISTS known_mints (
                    mint_url TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    mint_info TEXT NOT NULL,
                    updated_at INTEGER DEFAULT (cast(strftime('%s','now') as INTEGER))
                )
            `;

            // Create views
            const createBalanceView = `
                CREATE VIEW IF NOT EXISTS balance AS
                SELECT COALESCE(SUM(p.amount), 0) AS balance
                FROM proofs as p
                WHERE p.amount > 0
            `;

            const createBalanceUsedView = `
                CREATE VIEW IF NOT EXISTS balance_used AS
                SELECT COALESCE(SUM(p.amount), 0) AS used
                FROM proofsUsed as p
                WHERE amount > 0
            `;

            const createMintBalancesView = `
                CREATE VIEW IF NOT EXISTS MintBalances AS
                SELECT k.mintUrl AS mintUrl, COALESCE(SUM(p.amount), 0) AS balance
                FROM keysetIds AS k
                LEFT JOIN proofs AS p ON k.id = p.id
                GROUP BY mintUrl
            `;

            // Execute all table and view creation
            const allStatements = [
                createProofsTable,
                createProofsUsedTable,
                createKeysetIdsTable,
                createInvoicesTable,
                createPreferencesTable,
                createContactsTable,
                createKnownMintsTable,
                createBalanceView,
                createBalanceUsedView,
                createMintBalancesView,
            ];

            for (const statement of allStatements) {
                await db.exec(statement);
            }

            l("[Migration 1] Initial database schema created");
        },
        down: async () => {
            // Drop all tables and views
            const dropStatements = [
                "DROP VIEW IF EXISTS MintBalances",
                "DROP VIEW IF EXISTS balance_used",
                "DROP VIEW IF EXISTS balance",
                "DROP TABLE IF EXISTS known_mints",
                "DROP TABLE IF EXISTS contacts",
                "DROP TABLE IF EXISTS preferences",
                "DROP TABLE IF EXISTS invoices",
                "DROP TABLE IF EXISTS mintKeys",
                "DROP TABLE IF EXISTS keysetIds",
                "DROP TABLE IF EXISTS proofsUsed",
                "DROP TABLE IF EXISTS proofs",
            ];

            for (const statement of dropStatements) {
                await db.exec(statement);
            }

            l("[Migration 1] Database schema dropped");
        },
    },
    // Future migrations would go here
    // Example:
    // {
    //     version: 2,
    //     description: "Add new column to proofs table",
    //     up: async () => {
    //         await db.exec("ALTER TABLE proofs ADD COLUMN new_column TEXT");
    //     },
    //     down: async () => {
    //         // SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
    //         // This is why down migrations are optional and complex
    //     }
    // }
];

// Run all pending migrations
export const runMigrations = async (): Promise<void> => {
    l("[Migrations] Starting migration process");

    // Ensure migrations table exists
    await createMigrationsTable();

    // Get current version
    const currentVersion = await getCurrentVersion();
    l(`[Migrations] Current database version: ${currentVersion}`);

    // Filter migrations that need to be applied
    const pendingMigrations = migrations.filter(
        (m) => m.version > currentVersion
    );

    if (pendingMigrations.length === 0) {
        l("[Migrations] Database is up to date");
        return;
    }

    l(`[Migrations] Found ${pendingMigrations.length} pending migrations`);

    // Apply migrations in order
    for (const migration of pendingMigrations.sort(
        (a, b) => a.version - b.version
    )) {
        l(
            `[Migrations] Applying migration ${migration.version}: ${migration.description}`
        );

        try {
            await migration.up();
            await recordMigration(migration.version, migration.description);
            l(
                `[Migrations] Successfully applied migration ${migration.version}`
            );
        } catch (error) {
            l(
                `[Migrations] Failed to apply migration ${migration.version}:`,
                error
            );
            throw new Error(`Migration ${migration.version} failed: ${error}`);
        }
    }

    l("[Migrations] All migrations completed successfully");
};

// Run a specific migration down (rollback)
export const rollbackMigration = async (
    targetVersion: number
): Promise<void> => {
    const currentVersion = await getCurrentVersion();

    if (targetVersion >= currentVersion) {
        throw new Error("Target version must be lower than current version");
    }

    // Get migrations to rollback (in reverse order)
    const migrationsToRollback = migrations
        .filter((m) => m.version > targetVersion && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version);

    for (const migration of migrationsToRollback) {
        if (!migration.down) {
            throw new Error(
                `Migration ${migration.version} doesn't support rollback`
            );
        }

        l(
            `[Migrations] Rolling back migration ${migration.version}: ${migration.description}`
        );

        try {
            await migration.down();
            await db.run("DELETE FROM migrations WHERE version = ?", [
                migration.version,
            ]);
            l(
                `[Migrations] Successfully rolled back migration ${migration.version}`
            );
        } catch (error) {
            l(
                `[Migrations] Failed to rollback migration ${migration.version}:`,
                error
            );
            throw new Error(
                `Rollback of migration ${migration.version} failed: ${error}`
            );
        }
    }
};

// Get migration status
export const getMigrationStatus = async (): Promise<{
    currentVersion: number;
    availableVersion: number;
    pendingMigrations: number;
    appliedMigrations: {
        version: number;
        description: string;
        applied_at: number;
    }[];
}> => {
    await createMigrationsTable();

    const currentVersion = await getCurrentVersion();
    const availableVersion = Math.max(...migrations.map((m) => m.version));
    const pendingMigrations = migrations.filter(
        (m) => m.version > currentVersion
    ).length;

    const appliedMigrations = await db.all<{
        version: number;
        description: string;
        applied_at: number;
    }>("SELECT * FROM migrations ORDER BY version");

    return {
        currentVersion,
        availableVersion,
        pendingMigrations,
        appliedMigrations: appliedMigrations || [],
    };
};
