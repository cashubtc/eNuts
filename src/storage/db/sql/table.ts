


const createProofsTable = `
CREATE TABLE IF NOT EXISTS proofs (
	id TEXT NOT NULL,   
	amount INT NOT NULL,
	secret TEXT PRIMARY KEY NOT NULL,
	C TEXT NOT NULL
);
`
const createProofsUsedTable = `
CREATE TABLE IF NOT EXISTS proofsUsed (
	amount INTEGER NOT NULL,
	C TEXT NOT NULL,
	secret TEXT PRIMARY KEY NOT NULL,
	id TEXT NOT NULL
);
`
const createKeysetIdsTable = `
CREATE TABLE IF NOT EXISTS keysetIds (
	id TEXT,
	mintUrl TEXT,
	UNIQUE (id, mintUrl)
);
`
const createMintKeysTable = `
CREATE TABLE IF NOT EXISTS mintKeys (
	id TEXT NOT NULL,
	amount INTEGER NOT NULL,
	pubkey TEXT NOT NULL,

	UNIQUE (id, pubkey)
);
`
const createInvoicesTable = `
CREATE TABLE IF NOT EXISTS invoices (
	amount INTEGER NOT NULL,
	pr TEXT NOT NULL,
	hash TEXT PRIMARY KEY,
	time INTEGER DEFAULT (cast(strftime('%s','now') as INTEGER)),
	mintUrl TEXT NOT NULL
);
`
// preferences
const createPreferencesTable = `
CREATE TABLE IF NOT EXISTS preferences (
	id integer PRIMARY KEY ,
	formatBalance Bool NOT NULL,
	darkmode Bool NOT NULL,
	theme TEXT NOT NULL
);
`
const createContactsTable = `
CREATE TABLE IF NOT EXISTS contacts (
	id integer PRIMARY KEY AUTOINCREMENT ,
	name TEXT NOT NULL UNIQUE,
	ln TEXT NOT NULL UNIQUE,
	isOwner Bool Default False
);
`
export const tables: readonly string[] = [
	createProofsTable,
	createProofsUsedTable,
	createKeysetIdsTable,
	createMintKeysTable,
	createInvoicesTable,
	createPreferencesTable,
	createContactsTable
]
