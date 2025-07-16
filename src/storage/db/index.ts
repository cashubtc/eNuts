import type { Proof, Token } from "@cashu/cashu-ts";
import { env } from "@consts";
import { l } from "@log";
import type {
    IContact,
    IInvoice,
    IMint,
    IMintWithBalance,
    IPreferences,
    IPreferencesResp,
} from "@model";
import { arrToChunks, isObj } from "@util";

import { addMint, getMintIdsByUrl } from "./keysets";
import { tables } from "./sql/table";
import { views } from "./sql/view";
import { db } from "./database";

const INITIAL_SQL = `
PRAGMA cache_size=8192;
PRAGMA encoding="UTF-8";
PRAGMA synchronous=NORMAL;
PRAGMA temp_store=FILE;
`;

// ################################ init DB ################################
export async function initDb() {
    if (env.NODE_ENV === "test") {
        l("[initDb]", "reset DB in test mode");
        await db.reset();
    }
    await db.exec(INITIAL_SQL);
    const queries: readonly string[] = [...tables, ...views];
    await db.exec(queries.join(" "));
}

// ################################ Balance ################################
export async function getBalance(unused = true): Promise<number> {
    const result = await db.first<{ balance: number }>(
        `select * from ${unused ? "balance" : "balance_used"}`
    );
    l("[getBalance]", result);
    return result?.balance || 0;
}
export async function getMintsBalances(): Promise<IMintWithBalance[]> {
    const result = await db.all<{ balance: number; mintUrl: string }>(
        "select * from mintBalances"
    );
    l("[getMintsBalances]", result);
    if (!result || !result.length) {
        return [];
    }
    return result.map((r) => ({
        mintUrl: r.mintUrl,
        amount: r.balance,
        name: "",
    }));
}
export async function getMintBalance(mintUrl: string): Promise<number> {
    const mints = await getMintIdsByUrl(mintUrl);
    const proofs = await getProofs();
    const result: { [mintUrl: string]: number } = {};
    for (const mint of mints) {
        if (!result[mint.mintUrl]) {
            result[mint.mintUrl] = 0;
        }
        result[mint.mintUrl] += proofs.reduce((acc, p) => {
            if (p.id === mint.id) {
                acc += p.amount;
            }
            return acc;
        }, 0);
    }
    return result[mintUrl] || 0;
}
export async function checkBal() {
    const mintBalsTotal = (await getMintsBalances()).reduce(
        (acc, cur) => acc + cur.amount,
        0
    );
    const bal = await getBalance();
    l({ bal, mintBalsTotal });
    return mintBalsTotal !== bal;
}

// ################################ Token ################################
export async function addToken(token: Token): Promise<void> {
    const ids = token.proofs.map((x) => x.id);
    l("[addToken] adding mints");
    for (const id of ids) {
        await addMint({
            mintUrl: token.mint,
            id,
            active: true,
            fee: 0,
        });
    }
    l("[addToken] adding proofs");
    await addProofs(
        ...token.proofs.filter((p) => p && p.C && p.amount && p.secret && p.id)
    );
}

// ################################ used Proofs ################################
async function _addUsedProofs(...proofs: Proof[]) {
    if (!proofs || !proofs.length) {
        return;
    }
    const sqlPrefix =
        "INSERT OR IGNORE INTO proofsUsed (id, amount, secret, C) VALUES ";
    const sqlSuffix = proofs.map((_) => "(?, ?, ?, ?)").join(" , ");
    const sql = sqlPrefix + sqlSuffix;
    const params = proofs.flatMap((x) => [x.id, x.amount, x.secret, x.C]);
    const result = await db.run(sql, params);
    l("[_addUsedProofs]", result);
    return result?.changes === proofs.length;
}
async function addUsedProofs(...proofs: Proof[]): Promise<boolean> {
    if (!proofs || !proofs.length) {
        return false;
    }
    const results: (boolean | undefined)[] = [];
    for (const arr of arrToChunks(proofs, 100)) {
        results.push(await _addUsedProofs(...arr));
    }
    return results.every((x) => x);
}

// ################################ Proofs ################################
async function _addProofs(...proofs: Proof[]) {
    if (!proofs || !proofs.length) {
        return;
    }
    const sqlPrefix =
        "INSERT OR IGNORE INTO proofs (id, amount, secret, C) VALUES ";
    const sqlSuffix = proofs.map((_) => "(?, ?, ?, ?)").join(" , ");
    const sql = sqlPrefix + sqlSuffix;
    const params = proofs.flatMap((x) => [x.id, x.amount, x.secret, x.C]);
    const result = await db.run(sql, params);
    l("[_addProofs]", result);
    return result?.changes === proofs.length;
}
async function addProofs(...proofs: Proof[]): Promise<boolean> {
    if (!proofs || !proofs.length) {
        return false;
    }
    const results: (boolean | undefined)[] = [];
    for (const arr of arrToChunks(proofs, 100)) {
        results.push(await _addProofs(...arr));
    }
    return results.every((x) => x);
}
/* async function addProof({ id, amount, secret, C }: Proof) {
	const sql = 'INSERT OR IGNORE INTO proofs (id, amount, secret, C) VALUES (?, ?, ?, ?)'
	const params = [id, amount, secret, C]
	const result = await db.execInsert<Proof>(sql, params)
	l('[addProof]', result, { id, amount, secret, C })
	return !!(result?.insertId || result?.rowsAffected)
} */
export async function getProofs(): Promise<Proof[]> {
    const proofs = await db.all<Proof>("SELECT * FROM proofs", []);
    l("[getProofs]", proofs);
    if (!proofs || !proofs.length) {
        return [];
    }
    return proofs;
}
export async function getProofsByIds(ids: string[]): Promise<Proof[]> {
    const toGet = ids.map((id) => `"${id}"`).join(",");
    const proofs = await db.all<Proof>(
        `SELECT * FROM proofs WHERE id in (${toGet})`,
        []
    );
    if (!proofs || !proofs.length) {
        return [];
    }
    return proofs;
}
export async function getProofsByMintUrl(mintUrl: string): Promise<Proof[]> {
    const mintsIds = (await getMintIdsByUrl(mintUrl)).map((x) => x.id);
    const proofs = await getProofsByIds(mintsIds);
    return proofs;
}
export async function deleteProofs(
    proofs: Proof[]
): Promise<boolean | undefined> {
    if (!proofs || !proofs.length) {
        return;
    }
    const toDel = proofs.map((p) => `"${p.secret}"`).join(",");
    const ids = proofs.map((x) => `"${x.id}"`).join(",");
    const result = await db.run(
        `DELETE from proofs WHERE id in (${ids}) and secret in (${toDel})`
    );
    l("[deleteProofs]", result);
    void addUsedProofs(...proofs);
    return result?.changes === proofs.length;
}

// ################################ Preferences ################################
export async function getPreferences(): Promise<IPreferences> {
    const prefs = await db.first<IPreferencesResp>(
        "SELECT * FROM preferences limit 1"
    );
    l("[getPreferences]", prefs);
    return {
        id: prefs?.id || 1,
        darkmode: prefs?.darkmode === "true",
        theme: prefs?.theme || "Default",
        formatBalance: prefs?.formatBalance === "true",
        hasPref: isObj(prefs),
    };
}
export async function setPreferences(p: IPreferences) {
    const result = await db.run(
        "INSERT OR REPLACE INTO preferences (id, theme,darkmode,formatBalance) VALUES (?, ?,?, ?)",
        [1, p.theme, p.darkmode.toString(), p.formatBalance.toString()]
    );
    l("[setPreferences]", result);
    return result?.changes === 1;
}

// ################################ Invoices ################################
export async function addInvoice({
    pr,
    hash,
    amount,
    mintUrl,
}: Omit<IInvoice, "time">) {
    const result = await db.run(
        "INSERT OR IGNORE INTO invoices (amount,pr,hash,mintUrl) VALUES (?, ?, ?, ?)",
        [amount, pr, hash, mintUrl]
    );
    l("[addInvoice]", result);
    return result?.changes === 1;
}
export async function getAllInvoices(): Promise<IInvoice[]> {
    const result = await db.all<IInvoice>("Select * from invoices");
    l("[getAllInvoices]", result);
    if (!result || !result.length) {
        return [];
    }
    return result;
}
export async function delInvoice(hash: string) {
    const result = await db.run("Delete from invoices Where hash = ?", [hash]);
    l("[delInvoice]", result);
    return result?.changes === 1;
}
export async function getInvoice(hash: string) {
    const result = await db.first<IInvoice>(
        "SELECT * from invoices Where hash = ?",
        [hash]
    );
    l("[getInvoice]", result);
    return result;
}
export async function getInvoiceByPr(pr: string) {
    const result = await db.first<IInvoice>(
        "SELECT * from invoices Where pr = ?",
        [pr]
    );
    l("[getInvoiceByPr]", result);
    return result;
}

// ################################ Contacts ################################
export async function getContacts(): Promise<IContact[]> {
    interface ITempContact extends Omit<IContact, "isOwner"> {
        isOwner: number;
    }
    const contacts = await db.all<ITempContact>("select * from contacts");
    l("[getContacts]", contacts);
    return contacts?.map((c) => ({ ...c, isOwner: !!c.isOwner })) as IContact[];
}
export async function addContact(c: IContact) {
    const result = await db.run(
        "INSERT OR IGNORE INTO contacts (name, ln, isOwner) VALUES (?, ?, ?)",
        [c.name, c.ln, c?.isOwner ? 1 : 0]
    );
    l("[addContact]", result);
    return result?.changes === 1;
}
export async function editContact(c: Required<IContact>) {
    const result = await db.run(
        "UPDATE contacts SET name = ? , ln = ? WHERE id = ?",
        [c.name, c.ln, c.id]
    );
    l("[editContact]", result);
    return result?.changes === 1;
}
export async function delContact(id: number) {
    const result = await db.run("Delete from contacts Where id = ?", [id]);
    l("[delContact]", result);
    return result?.changes === 1;
}

// ################################ Drops ################################
export function dropProofs() {
    return dropTable("proofs");
}
export function dropContacts() {
    return dropTable("contacts");
}
export async function dropTable(table: string) {
    await db.run(`drop table ${table}`);
}
export async function dropAll() {
    try {
        await Promise.all([
            dropTable("preferences"),
            dropTable("contacts"),
            dropTable("keysetIds"),
            dropTable("proofsUsed"),
            dropTable("mintKeys"),
            dropTable("proofs"),
            dropTable("invoices"),
        ]);
    } catch {
        // ignore
    }
}

// ################################ Re-exports from keysets.ts ################################
export {
    getMints,
    getMintsUrls,
    addMint,
    addMints,
    addAllMintIds,
    hasMints,
    getMintByKeySetId,
    getMintIdsByUrl,
    deleteMint,
} from "./keysets";
