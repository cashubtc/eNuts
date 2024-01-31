import {
	CashuMint, CashuWallet, deriveKeysetId,
	deriveSeedFromMnemonic,
	getDecodedToken,
	getEncodedToken,
	type GetInfoResponse, type MintKeys,
	type PayLnInvoiceResponse, type Proof,
	type RequestMintResponse
} from '@cashu/cashu-ts'
import { _testmintUrl } from '@consts'
import {
	addInvoice, addMint, addToken, deleteProofs,
	delInvoice, getAllInvoices, getInvoice,
	getMintsBalances, getMintsUrls
} from '@db'
import { getSeed } from '@db/backup'
import { l } from '@log'
import type { IInvoice, ITokenInfo } from '@model'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { cTo, toJson } from '@src/storage/store/utils'
import { getCustomMintNames } from '@store/mintStore'
import { decodeLnInvoice, isCashuToken, isNum } from '@util'

import { sumProofsValue, sumTokenProofs } from './proofs'
import { getProofsToUse } from './util'

const _mintKeysMap: { [mintUrl: string]: { [keySetId: string]: MintKeys } } = {}
const wallets: { [mintUrl: string]: CashuWallet } = {}

/*
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#restore

	- constructor
	-> new CashuWallet(mint, keys?, mnemonicOrSeed?): CashuWallet
	-> getSeed() - saveSeed(seed) in "/src/storage/db/backup.ts"
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#constructor

	----------------------------------------------------------------------------------

	Methods that accept the counter parameter for restore:

	- wallet.receive
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#receive

	- wallet.requestTokens
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#requestTokens

	- wallet.send
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#send

	- wallet.payLnInvoice
	https://cashubtc.github.io/cashu-ts/docs/classes/CashuWallet.html#payLnInvoice

*/

function _setKeys(mintUrl: string, keys: MintKeys, keySetId?: string): void {
	if (!keySetId) { keySetId = deriveKeysetId(keys) }
	if (!_mintKeysMap[mintUrl]) { _mintKeysMap[mintUrl] = {} }
	if (!_mintKeysMap[mintUrl][keySetId]) {
		_mintKeysMap[mintUrl][keySetId] = keys
		if (!wallets[mintUrl] || wallets[mintUrl].keysetId === keySetId) { return }
		wallets[mintUrl].keys = keys
	}
}

async function getWallet(mintUrl: string): Promise<CashuWallet> {
	if (wallets[mintUrl]) { return wallets[mintUrl] }
	const mint = new CashuMint(mintUrl)
	l({ mint })
	const seed = await getSeed()
	const keys = await mint.getKeys()
	const wallet = new CashuWallet(mint, keys, seed)
	_setKeys(mintUrl, keys)
	wallets[mintUrl] = wallet
	return wallet
}

async function getCurrentKeySetId(mintUrl: string): Promise<string> {
	const wallet = await getWallet(mintUrl)
	l({ wallet })
	const keys = await (await getWallet(mintUrl)).mint.getKeys()
	const keySetId = deriveKeysetId(keys)
	_setKeys(mintUrl, keys, keySetId)
	return keySetId
}

export function getMintCurrentKeySetId(mintUrl: string): Promise<string> {
	return getCurrentKeySetId(mintUrl)
}

export function getMintKeySetIds(mintUrl: string): Promise<{ keysets: string[] }> {
	return CashuMint.getKeySets(mintUrl)
}

export function getMintInfo(mintUrl: string): Promise<GetInfoResponse> { return CashuMint.getInfo(mintUrl) }

export async function isTokenSpendable(token: string): Promise<boolean> {
	try {
		const decoded = getDecodedToken(token)
		if (!decoded?.token?.length) { return false }
		const useableTokenProofs: Proof[] = []
		for (const t of decoded.token) {
			if (!t?.proofs?.length) { continue }
			// eslint-disable-next-line no-await-in-loop
			const w = await getWallet(t.mint)
			// eslint-disable-next-line no-await-in-loop
			const usedSecrets = (await w.checkProofsSpent(t.proofs)).map(x => x.secret)
			if (usedSecrets.length === t.proofs.length) {
				// usedTokens.push(token)
				continue
			}
			useableTokenProofs.push(...t.proofs.filter(x => !usedSecrets.includes(x.secret)))
		}
		return !!useableTokenProofs.length
	} catch (_) { return false }
}

export async function checkProofsSpent(mintUrl: string, toCheck: { secret: string }[]): Promise<{ secret: string }[]> {
	return (await getWallet(mintUrl)).checkProofsSpent(toCheck)
}

export async function checkFees(mintUrl: string, invoice: string): Promise<number> {
	const { fee } = await CashuMint.checkFees(mintUrl, { pr: invoice })
	return fee
}
export async function claimToken(encodedToken: string): Promise<boolean> {
	encodedToken = isCashuToken(encodedToken) || ''
	if (!encodedToken?.trim()) { return false }
	const decoded = getDecodedToken(encodedToken)
	if (!decoded?.token?.length) { return false }
	const trustedMints = await getMintsUrls()
	const tokenEntries = decoded.token.filter(x => trustedMints.includes(x.mint))
	if (!tokenEntries?.length) { return false }
	const mintUrls = tokenEntries.map(x => x.mint).filter(x => x)
	if (!mintUrls?.length) { return false }
	const wallet = await getWallet(mintUrls[0])
	const counter = await getCounterByMintUrl(mintUrls[0])
	try {
		const { token, tokensWithErrors, newKeys } = await wallet.receive(encodedToken, undefined, counter)
		if (newKeys) { _setKeys(mintUrls[0], newKeys) }
		l('[claimToken]', { token, tokensWithErrors }, getEncodedToken(token))
		await addToken(token)
		if (tokensWithErrors) {
			if (await isTokenSpendable(getEncodedToken(tokensWithErrors))) {
				l('[claimToken][tokensWithErrors]', tokensWithErrors)
				await addToken(tokensWithErrors)
			}
		}
		for (const mint of mintUrls) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		if (!token?.token?.length) { return false }
		await incrementCounterByMintUrl(mintUrls[0], sumTokenProofs(token))
		return true
	} catch (e) {
		l('[claimToken] error', { e })
		return false
	}
}
export async function requestMint(mintUrl: string, amount: number): Promise<RequestMintResponse> {
	const wallet = await getWallet(mintUrl)
	const result = await wallet.requestMint(amount)
	await addInvoice({ amount, mintUrl, ...result })
	runRequestTokenLoop()
	l('[requestMint]', { result, mintUrl, amount })
	return result
}
export async function requestToken(mintUrl: string, amount: number, hash: string): Promise<{ success: boolean; invoice: IInvoice | null | undefined }> {
	const invoice = await getInvoice(hash)
	const wallet = await getWallet(mintUrl)
	const counter = await getCounterByMintUrl(mintUrl)
	try {
		const { proofs, newKeys } = await wallet.requestTokens(amount, hash, undefined, counter)
		l('[requestToken]', { proofs, mintUrl, amount, hash })
		if (newKeys) { _setKeys(mintUrl, newKeys) }
		await addToken({ token: [{ mint: mintUrl, proofs }] })
		await delInvoice(hash)
		await incrementCounterByMintUrl(mintUrl, proofs.length)
	} catch (e) {
		l('[requestToken] error: ', e)
		return { success: false, invoice }
	}
	return { success: true, invoice }
}

export async function payLnInvoice(mintUrl: string, invoice: string, fee: number, proofs: Proof[] = []): Promise<{ result?: PayLnInvoiceResponse, fee?: number, realFee?: number, error?: unknown }> {
	const wallet = await getWallet(mintUrl)
	const { amount } = decodeLnInvoice(invoice)
	if (!amount) { throw new Error('bad invoice amount') }
	const amountToPay = amount + fee
	if (!proofs?.length) {
		const { proofsToUse } = await getProofsToUse(mintUrl, amountToPay)
		proofs = proofsToUse
	}
	try {
		if (sumProofsValue(proofs) > amountToPay) {
			l('[payLnInvoce] use send ', { amountToPay, amount, fee, proofs: sumProofsValue(proofs) })
			const counter = await getCounterByMintUrl(mintUrl)
			const { send, returnChange, newKeys } = await wallet.send(amountToPay, proofs, undefined, counter)
			if (newKeys) { _setKeys(mintUrl, newKeys) }
			if (returnChange?.length) { await addToken({ token: [{ mint: mintUrl, proofs: returnChange }] }) }
			if (send?.length) {
				await deleteProofs(proofs)
				await incrementCounterByMintUrl(mintUrl, send.length)
			}
			proofs = send
		}
		l({ fee, sum: sumProofsValue(proofs) })
		const counter = await getCounterByMintUrl(mintUrl)
		const result = await wallet.payLnInvoice(invoice, proofs, fee, counter)
		if (result?.newKeys) { _setKeys(mintUrl, result.newKeys) }
		if (result?.change?.length) { await addToken({ token: [{ mint: mintUrl, proofs: result.change }] }) }
		if (result.isPaid) { await deleteProofs(proofs) }
		const realFee = fee - sumProofsValue(result.change)
		if (realFee < 0) {
			l('######################################## ERROR ####################################')
			l({ result, fee, realFee, amountToPay, amount, proofs: sumProofsValue(proofs) })
		}
		await incrementCounterByMintUrl(mintUrl, proofs.length)
		return { result, fee, realFee }
	} catch (error) {
		await addToken({ token: [{ mint: mintUrl, proofs }] })
		return { result: undefined, error }
	}
}

export async function sendToken(mintUrl: string, amount: number, memo: string, proofs: Proof[] = []): Promise<string> {
	const wallet = await getWallet(mintUrl)
	if (!proofs?.length) {
		const { proofsToUse } = await getProofsToUse(mintUrl, amount)
		proofs = proofsToUse
	}
	const counter = await getCounterByMintUrl(mintUrl)
	// will throw if not enough proofs are available
	const { send, returnChange, newKeys } = await wallet.send(amount, proofs, undefined, counter)
	if (newKeys) { _setKeys(mintUrl, newKeys) }
	// add change back to db
	if (returnChange?.length) { await addToken({ token: [{ mint: mintUrl, proofs: returnChange }] }) }
	await deleteProofs(proofs)
	await incrementCounterByMintUrl(mintUrl, send.length)
	return getEncodedToken({ token: [{ mint: mintUrl, proofs: send }], memo: memo.length > 0 ? memo : 'Sent via eNuts.' })
}

export async function autoMintSwap(
	srcMintUrl: string,
	destMintUrl: string,
	amount: number,
	fee: number,
	proofs: Proof[] = []
): Promise<{ payResult: { result?: PayLnInvoiceResponse, fee?: number, realFee?: number, error?: unknown }; requestTokenResult: { success: boolean; invoice?: IInvoice | null } }> {
	if (!isNum(fee) || fee <= 0) { fee = await checkFees(srcMintUrl, (await requestMint(destMintUrl, amount)).pr) }
	l('[autoMintSwap]', { fee, amount, srcMintUrl, destMintUrl })
	if (!amount || !isNum(amount) || isNaN(amount) || !isFinite(amount) || amount <= 0) {
		throw new Error('Swap Error: not enough funds')
	}
	const { pr, hash } = await requestMint(destMintUrl, amount)
	if (!proofs?.length) {
		const { proofsToUse } = await getProofsToUse(srcMintUrl, amount + fee)
		proofs = proofsToUse
	}
	const payResult = await payLnInvoice(srcMintUrl, pr, fee, proofs)
	l('[autoMintSwap]', { payResult })
	if (!payResult?.result?.isPaid) { throw new Error('Swap Error: pay failed') }
	const requestTokenResult = await requestToken(destMintUrl, amount, hash)
	l('[autoMintSwap]', { requestTokenResult })
	if (!requestTokenResult) { throw new Error('Swap Error: request token failed') }
	return {
		payResult,
		requestTokenResult,
	}
}

export async function fullAutoMintSwap(tokenInfo: ITokenInfo, destMintUrl: string) {
	l('[fullAutoMintSwap] ', { tokenInfo, destMintUrl })
	try {
		const srcMintUrl = tokenInfo.mints[0]
		const invoice = await requestMint(destMintUrl, tokenInfo.value)
		const estFee = await checkFees(srcMintUrl, invoice.pr)
		const proofs: Proof[] = []
		for (const t of tokenInfo.decoded.token) {
			proofs.push(...t.proofs)
		}
		const { payResult, requestTokenResult } = await autoMintSwap(
			srcMintUrl,
			destMintUrl,
			tokenInfo.value - estFee,
			estFee,
			proofs
		)
		l('[fullAutoMintSwap]', { payResult, requestTokenResult })
		return { payResult, requestTokenResult, estFeeResp: estFee }
	} catch (e) {
		return { payResult: undefined, requestTokenResult: undefined }
	}
}

export async function recoverWallet(mintUrl: string, mnemonic: string) {
	try {
		const mint = new CashuMint(mintUrl)
		l({ mint })
		const seed = deriveSeedFromMnemonic(mnemonic)
		const keys = await mint.getKeys()
		l({ keysBeforeRestore: keys })
		const wallet = new CashuWallet(mint, keys, seed)
		_setKeys(mintUrl, keys)
		wallets[mintUrl] = wallet
		// TODO test
		const resp = await wallet.restore(0, 10)
		l('[recoverWallet] wallet.restore response: ', { resp })
		return resp
	} catch (e) {
		l('[recoverWallet] error', { e })
	}
}

interface ICounters {
	[key: string]: number
}

export async function incrementCounterByMintUrl(mintUrl: string, count: number) {
	try {
		const seed = await getSeed()
		if (!seed) { return }
		const counters = await store.get(STORE_KEYS.restoreCounter)
		if (!counters) {
			throw new Error('Seed is available but counters have not been set!')
		}
		const parsedCounters = cTo<ICounters>(counters)
		const keysetId = await getMintCurrentKeySetId(mintUrl)
		parsedCounters[keysetId] = (parsedCounters[keysetId] || 0) + count
		await store.set(STORE_KEYS.restoreCounter, toJson(parsedCounters))
	} catch (e) {
		l('[incrementCounterByKeysetId] Error during counter increment: ', e)
		throw new Error('[incrementCounterByKeysetId] Error during counter increment')
	}
}

export async function getCounterByMintUrl(mintUrl: string) {
	try {
		const counters = await store.get(STORE_KEYS.restoreCounter)
		if (!counters) { return }
		const parsedCounters = cTo<ICounters>(counters)
		const keysetId = await getMintCurrentKeySetId(mintUrl)
		if (!parsedCounters[keysetId]) {
			parsedCounters[keysetId] = 0
		}
		await store.set(STORE_KEYS.restoreCounter, toJson(parsedCounters))
		l('[getCounterByKeysetId] ', { keysetId, counter: parsedCounters[keysetId] })
		return parsedCounters[keysetId]
	} catch (e) {
		l('[getCounterByKeysetId] Error while getCounter: ', e)
		throw Error('[getCounterByKeysetId] Error while getCounter')
	}
}

// This won't work if the source mint is not in our db
/* export async function fullAutoMintSwap(srcMintUrl: string, destMintUrl: string, fee: number) {
	let amount = await getMintBalance(srcMintUrl)
	let result = await autoMintSwap(srcMintUrl, destMintUrl, amount, fee)
	amount = await getMintBalance(srcMintUrl)
	l('[fullAutoMintSwap]', result, 'srcMint new Bal:', amount)
	if (amount <= 0) { return { result } }
	try {
		result = await autoMintSwap(srcMintUrl, destMintUrl, amount, fee)
		l('[fullAutoMintSwap][round: 2]', result)
	} catch (error) { return { result, error } }
	return { result }
} */

// get mints for send/receive process
export async function getMintsForPayment() {
	const mintsBals = await getMintsBalances()
	const mints = await getCustomMintNames(mintsBals.map(m => ({ mintUrl: m.mintUrl })))
	return { mintsBals, mints }
}

export async function getHighestBalMint() {
	const { mintsBals, mints } = await getMintsForPayment()
	const filtered = mintsBals.filter(m => m.mintUrl !== _testmintUrl)
	const highestBalance = Math.max(...filtered.map(m => m.amount))
	const highestBalanceMint = mintsBals.find(m => m.amount === highestBalance)
	return { mints, highestBalance, highestBalanceMint }
}

let isRequestTokenLoopRunning = false
let loopHandel: NodeJS.Timeout
export function runRequestTokenLoop(): void {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	loopHandel = setTimeout(requestTokenLoop, 60000)
}

async function requestTokenLoop(): Promise<void> {
	if (isRequestTokenLoopRunning) { return }
	isRequestTokenLoopRunning = true
	const invoices = await getAllInvoices()
	if (!invoices.length) {
		clearTimeout(loopHandel)
	}
	for (const invoice of invoices) {
		try {
			// eslint-disable-next-line no-await-in-loop
			await requestToken(invoice.mintUrl, invoice.amount, invoice.hash)
			// TODO notify user and add history entry
		} catch (_) {/* ignore */ }
		const { expiry } = decodeLnInvoice(invoice.pr)
		const date = new Date((invoice.time * 1000) + (expiry * 1000)).getTime()
		// eslint-disable-next-line no-await-in-loop
		if (Date.now() > date) { await delInvoice(invoice.hash) }
	}
	isRequestTokenLoopRunning = false
}
