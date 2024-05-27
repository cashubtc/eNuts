import type { Proof, Token } from '@cashu/cashu-ts'
import { CashuMint, deriveKeysetId, getDecodedToken } from '@cashu/cashu-ts'
import { env } from '@consts'
import { l } from '@log'
import type { IContact, IInvoice, IMint, IMintWithBalance, IPreferences, IPreferencesResp, ITx } from '@model'
import { arrToChunks, isObj } from '@util'
import * as SQLite from 'expo-sqlite/legacy'

import { Db } from './Db'
import { tables } from './sql/table'
import { views } from './sql/view'

async function getCurrentKeySetId(mintUrl: string) {
	const keys = await CashuMint.getKeys(mintUrl)
	const keySetId = deriveKeysetId(keys)
	return keySetId
}

const db = new Db(SQLite.openDatabase('cashu.db'))
/*  ### table names ###
	proofs
	proofsUsed

	mints
	keysetIds
	mintKeys

	invoices
*/


// ################################ init DB ################################
export async function initDb() {
	if (env.NODE_ENV === 'test') {
		l('[initDb]', 'reset DB in test mode')
		await db.reset(SQLite.openDatabase('cashu.db'))
	}
	await db.execMany([
		{ sql: 'PRAGMA cache_size=8192;', args: [] },
		{ sql: 'PRAGMA encoding="UTF-8";', args: [] },
		{ sql: 'PRAGMA synchronous=NORMAL;', args: [] },
		{ sql: 'PRAGMA temp_store=FILE;', args: [] },
	], false)
	const queries: readonly string[] = [
		...tables,
		...views
	]
	const cmds: ITx[] = queries.map(query => ({
		sql: query,
		args: [],
		errorCb: (_: any, error: unknown) => {
			l('[initDb]', query, 'DB init error!', error)
			return true
		},
	}))
	return db.execTxs(
		cmds,
		err => { l('[initDb]', 'DB init error!', err) },
		() => { l('[initDb]', 'DB init success!') }
	)
}


// ################################ Balance ################################
export async function getBalance(unused = true): Promise<number> {
	return (await db.get<{ balance: number }>(`select * from ${unused ? 'balance' : 'balance_used'}`, []))?.balance || 0
}
export async function getMintsBalances(): Promise<IMintWithBalance[]> {
	const result = await db.all<{ balance: number, mintUrl: string }>(
		'select * from mintBalances',
		[]
	)
	return result.map(r => ({ mintUrl: r.mintUrl, amount: r.balance, name: '' }))
}

/* export async function getMintsBalances(): Promise<IMintWithBalance[]> {
	const mints = await getMints()
	const proofs = await getProofs()
	const result: { [mintUrl: string]: number } = {}
	for (const mint of mints) {
		if (!result[mint.mintUrl]) { result[mint.mintUrl] = 0 }
		result[mint.mintUrl] += proofs.reduce((acc, p) => {
			if (p.id === mint.id) { acc += p.amount }
			return acc
		}, 0)
	}
	return Object.entries(result).map(([mintUrl, amount]) => ({ mintUrl, amount, name: '' }))
} */
export async function getMintBalance(mintUrl: string): Promise<number> {
	const mints = await getMintIdsByUrl(mintUrl)
	const proofs = await getProofs()
	const result: { [mintUrl: string]: number } = {}
	for (const mint of mints) {
		if (!result[mint.mintUrl]) { result[mint.mintUrl] = 0 }
		result[mint.mintUrl] += proofs.reduce((acc, p) => {
			if (p.id === mint.id) { acc += p.amount }
			return acc
		}, 0)
	}
	return result[mintUrl] || 0
}
export async function checkBal() {
	const mintBalsTotal = (await getMintsBalances())
		.reduce((acc, cur) => acc + cur.amount, 0)
	const bal = await getBalance()
	l({ bal, mintBalsTotal })
	return mintBalsTotal !== bal
}


// ################################ Token ################################

export async function addToken(token: Token | string): Promise<void> {
	let decoded: Token
	if (typeof token === 'string') {
		decoded = getDecodedToken(token)
	} else {
		decoded = token
	}
	if (!decoded?.token?.length) { return }
	for (const t of decoded.token) {
		const ids = t.proofs.map(x => x.id)
		l('[addToken] adding mints')
		for (const id of ids) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(t.mint, id)
		}
		l('[addToken] adding proofs')
		// eslint-disable-next-line no-await-in-loop
		await addProofs(...t.proofs.filter(p => p && p.C && p.amount && p.secret && p.id))
	}
}

// ################################ used Proofs ################################
async function _addUsedProofs(...proofs: Proof[]) {
	if (!proofs || !proofs.length) { return }
	const sqlPrefix = 'INSERT OR IGNORE INTO proofsUsed (id, amount, secret, C) VALUES '
	const sqlSuffix = proofs.map(_ => '(?, ?, ?, ?)').join(' , ')
	const sql = sqlPrefix + sqlSuffix
	const params = proofs.flatMap(x => ([x.id, x.amount, x.secret, x.C]))
	const result = await db.execInsert<Proof>(sql, params)
	l('[addUsedProofs]', result, proofs)
	return result?.rowsAffected === proofs.length
}
async function addUsedProofs(...proofs: Proof[]): Promise<boolean> {
	if (!proofs || !proofs.length) { return false }
	const results: (boolean | undefined)[] = []
	for (const arr of arrToChunks(proofs, 100)) {
		// eslint-disable-next-line no-await-in-loop
		results.push(await _addUsedProofs(...arr))
	}
	return results.every(x => x)
}
// ################################ Proofs ################################
async function _addProofs(...proofs: Proof[]) {
	if (!proofs || !proofs.length) { return }
	const sqlPrefix = 'INSERT OR IGNORE INTO proofs (id, amount, secret, C) VALUES '
	const sqlSuffix = proofs.map(_ => '(?, ?, ?, ?)').join(' , ')
	const sql = sqlPrefix + sqlSuffix
	const params = proofs.flatMap(x => ([x.id, x.amount, x.secret, x.C]))
	const result = await db.execInsert<Proof>(sql, params)
	l('[addProofs]', result, proofs)
	return result?.rowsAffected === proofs.length
}
async function addProofs(...proofs: Proof[]): Promise<boolean> {
	if (!proofs || !proofs.length) { return false }
	const results: (boolean | undefined)[] = []
	for (const arr of arrToChunks(proofs, 100)) {
		// eslint-disable-next-line no-await-in-loop
		results.push(await _addProofs(...arr))
	}
	return results.every(x => x)
}
/* async function addProof({ id, amount, secret, C }: Proof) {
	const sql = 'INSERT OR IGNORE INTO proofs (id, amount, secret, C) VALUES (?, ?, ?, ?)'
	const params = [id, amount, secret, C]
	const result = await db.execInsert<Proof>(sql, params)
	l('[addProof]', result, { id, amount, secret, C })
	return !!(result?.insertId || result?.rowsAffected)
} */
export async function getProofs(): Promise<Proof[]> {
	const proofs = await db.all<Proof>('SELECT * FROM proofs', [])
	l('[getProofs]', proofs)
	return proofs
}
export async function getProofsByIds(ids: string[]): Promise<Proof[]> {
	const toGet = ids.map(id => `"${id}"`).join(',')
	const proofs = await db.all<Proof>(`SELECT * FROM proofs WHERE id in (${toGet})`, [])
	return proofs
}
export async function getProofsByMintUrl(mintUrl: string): Promise<Proof[]> {
	const mintsIds = (await getMintIdsByUrl(mintUrl)).map(x => x.id)
	const proofs = await getProofsByIds(mintsIds)
	return proofs
}
export async function deleteProofs(proofs: Proof[]): Promise<boolean | undefined> {
	if (!proofs || !proofs.length) { return }
	const toDel = proofs.map(p => `"${p.secret}"`).join(',')
	const ids = proofs.map(x => `"${x.id}"`).join(',')
	const result = await db.execTx(`DELETE from proofs WHERE id in (${ids}) and secret in (${toDel})`, [])
	l('[deleteProofs]', { result, proofs })
	void addUsedProofs(...proofs)
	return result.rowsAffected === proofs.length
}

// ################################ Mints ################################
export async function getMints(): Promise<IMint[]> {

	const result = await db.all<IMint>('SELECT * FROM keysetIds', [])
	l('[getMints]', result)
	return result
}
/**
 * get all unique mint urls in db 
 * 
 *	if asObj is false or undefined, returns array of strings

 * @export
 * @param {false} [asObj] optional, if false or undefined, returns array of strings
 * @return {*}  {Promise<string[]>}
 */
export async function getMintsUrls(asObj?: false): Promise<string[]>
/**
 * get all unique mint urls in db 
 * 
 *	if asObj is true, returns array of objects with key mintUrl

 * @deprecated  this overload will be removed in the future
 *
 * @export
 * @param {true} asObj
 * @return {*}  {Promise<{ mintUrl: string }[]>}
 */
export async function getMintsUrls(asObj: true): Promise<{ mintUrl: string }[]>
export async function getMintsUrls(asObj = false): Promise<(string | { mintUrl: string })[]> {

	const result = await db.all<{ mintUrl: string }>('SELECT DISTINCT mintUrl FROM keysetIds', [])
	l('Mints', result)
	return asObj ? result : result.map(x => x.mintUrl)
}
export async function addMint(mintUrl: string, id = ''): Promise<boolean> {
	const sql = 'INSERT OR IGNORE INTO keysetIds (id, mintUrl) VALUES (?, ?)'
	if (!id) { id = await getCurrentKeySetId(mintUrl) }
	const params = [id, mintUrl]
	const result = await db.execInsert<IMint>(sql, params)
	l('[addMint]', 'mint added', result)
	return result?.rowsAffected === 1
}
async function _addMints(...args: { mintUrl: string, id: string }[]): Promise<boolean> {
	if (!args || !args.length) { return false }
	const sqlPrefix = 'INSERT OR IGNORE INTO keysetIds (id, mintUrl) VALUES '
	const sqlSuffix = args.map(_ => '(?, ?)').join(' , ')
	const sql = sqlPrefix + sqlSuffix
	const params = args.flatMap(x => ([x.id, x.mintUrl]))
	const result = await db.execInsert<IMint[]>(sql, params)
	l('[addMints]', 'mints added', result)
	return result?.rowsAffected === args.length
}
export async function addMints(...args: { mintUrl: string, id: string }[]): Promise<boolean> {
	if (!args || !args.length) { return false }
	const results: boolean[] = []
	for (const arr of arrToChunks(args, 100)) {
		// eslint-disable-next-line no-await-in-loop
		results.push(await _addMints(...arr))
	}
	return results.every(x => x)
}
export async function addAllMintIds() {
	const mints = await getMints()
	const toDo: { mintUrl: string, id: string }[] = []
	for (const mint of mints) {
		// eslint-disable-next-line no-await-in-loop
		const ids = (await CashuMint.getKeySets(mint.mintUrl)).keysets
		for (const id of ids) {
			if (mints.some(x => x.id === id && x.mintUrl === mint.mintUrl)) { continue }
			// eslint-disable-next-line no-await-in-loop
			toDo.push({ mintUrl: mint.mintUrl, id })
		}
	}
	await addMints(...toDo)
}
export async function hasMints(): Promise<boolean> {
	const mintCountResult = await db.get<{ count: number }>('SELECT count(id) as count FROM keysetIds limit 1')
	// l('[hasMints]', mintCountResult)
	return !!mintCountResult?.count
}
export async function getMintByKeySetId(id: string): Promise<IMint | undefined | null> {
	const x = await db.get<IMint>('SELECT * FROM keysetIds WHERE id = ?', [id])
	return x
}
export async function getMintIdsByUrl(mintUrl: string): Promise<IMint[]> {
	const x = await db.all<IMint>('SELECT * FROM keysetIds WHERE mintUrl = ?', [mintUrl])
	return x
}
export async function deleteMint(mintUrl: string) {
	const result = await db.execTx('DELETE from keysetIds WHERE mintUrl = ? ', [mintUrl])
	l('[deleteMint]', result, mintUrl)
	return result.rowsAffected === 1
}
// ################################ Preferences ################################
export async function getPreferences(): Promise<IPreferences> {
	const x = await db.get<IPreferencesResp>('SELECT * FROM preferences limit 1', [])
	return {
		id: x?.id || 1,
		darkmode: x?.darkmode === 'true',
		theme: x?.theme || 'Default',
		formatBalance: x?.formatBalance === 'true',
		hasPref: isObj(x)
	}
}
export async function setPreferences(p: IPreferences) {
	const x = await db.execInsert<IPreferences>(
		'INSERT OR REPLACE INTO preferences (id, theme,darkmode,formatBalance) VALUES (?, ?,?, ?)',
		[1, p.theme, p.darkmode.toString(), p.formatBalance.toString()]
	)
	return x.rowsAffected === 1
}

// ################################ Invoices ################################
export async function addInvoice({ pr, hash, amount, mintUrl }: Omit<IInvoice, 'time'>) {
	const result = await db.execInsert<IInvoice>(
		'INSERT OR IGNORE INTO invoices (amount,pr,hash,mintUrl) VALUES (?, ?, ?, ?)',
		[amount, pr, hash, mintUrl]
	)
	l('[addInvoice]', result, { pr, hash, amount, mintUrl })
	return result.rowsAffected === 1
}
export async function getAllInvoices(): Promise<IInvoice[]> {
	const result = await db.all<IInvoice>(
		'Select * from invoices',
		[]
	)
	return result
}
export async function delInvoice(hash: string) {
	const result = await db.execTx<IInvoice>(
		'Delete from invoices Where hash = ?',
		[hash]
	)
	l('[delInvoice]', result, { hash })
	return result.rowsAffected === 1
}
export async function getInvoice(hash: string) {
	const result = await db.execSelect<IInvoice>(
		'SELECT * from invoices Where hash = ?',
		[hash]
	)
	l('[getInvoice]', result, { hash })
	return result?.item?.(0)
}
export async function getInvoiceByPr(pr: string) {
	const result = await db.execSelect<IInvoice>(
		'SELECT * from invoices Where pr = ?',
		[pr]
	)
	l('[getInvoice]', result, { pr })
	return result?.item?.(0)
}

// ################################ Contacts ################################
export async function getContacts(): Promise<IContact[]> {
	interface ITempContact extends Omit<IContact, 'isOwner'> { isOwner: number }
	const contacts = await db.all<ITempContact>('select * from contacts')
	// l('[getContacts]', contacts)
	return contacts.map(c => ({ ...c, isOwner: !!c.isOwner })) as IContact[]
}
export async function addContact(c: IContact) {
	const result = await db.execInsert(
		'INSERT INTO contacts (name, ln, isOwner) VALUES (?, ?, ?)',
		[c.name, c.ln, c?.isOwner ? 1 : 0]
	)
	l('[addContact]', result, c)
	return result.rowsAffected === 1
}
export async function editContact(c: Required<IContact>) {
	const result = await db.execTx(
		'UPDATE contacts SET name = ? , ln = ? WHERE id = ?',
		[c.name, c.ln, c.id]
	)
	l('[editContact]', result, c)
	return result.rowsAffected === 1
}
export async function delContact(id: number) {
	const result = await db.execTx(
		'Delete from contacts Where id = ?',
		[id]
	)
	l('[delContact]', result, { id })
	return result.rowsAffected === 1
}



// ################################ Drops ################################
export function dropProofs() {
	return dropTable('proofs')
}
export function dropContacts() {
	return dropTable('contacts')
}
export function dropTable(table: string) {
	return db.execTx(`drop table ${table}`, [])
}
export async function dropAll() {
	try {
		await Promise.all([
			dropTable('preferences'),
			dropTable('contacts'),
			dropTable('keysetIds'),
			dropTable('proofsUsed'),
			dropTable('mintKeys'),
			dropTable('proofs'),
			dropTable('invoices'),
		])
	} catch (e) {
		// ignore
	}
}