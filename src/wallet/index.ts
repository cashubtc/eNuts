import {
	CashuMint, CashuWallet, deriveKeysetId,
	getDecodedLnInvoice, getDecodedToken,
	getEncodedToken, type MintKeys, type Proof
} from '@cashu/cashu-ts'
import {
	addInvoice, addMint, addToken, deleteProofs,
	delInvoice, getAllInvoices, getInvoice,
	getMintBalance, getMintsUrls
} from '@db'
import { l } from '@log'
import { isCashuToken } from '@util'

import { sumProofsValue } from './proofs'
import { getProofsToUse } from './util'

const _mintKeysMap: { [mintUrl: string]: { [keySetId: string]: MintKeys } } = {}
const wallets: { [mintUrl: string]: CashuWallet } = {}

function _setKeys(mintUrl: string, keys: MintKeys, keySetId?: string) {
	if (!keySetId) { keySetId = deriveKeysetId(keys) }
	if (!_mintKeysMap[mintUrl]) { _mintKeysMap[mintUrl] = {} }
	if (!_mintKeysMap[mintUrl][keySetId]) {
		_mintKeysMap[mintUrl][keySetId] = keys
		if (!wallets[mintUrl] || wallets[mintUrl].keysetId === keySetId) { return }
		wallets[mintUrl].keys = keys
	}
}

async function getWallet(mintUrl: string) {
	if (wallets[mintUrl]) { return wallets[mintUrl] }
	const mint = new CashuMint(mintUrl)
	l({ mint })
	const keys = await mint.getKeys()
	l({ keys })
	const wallet = new CashuWallet(mint, keys)
	_setKeys(mintUrl, keys)
	wallets[mintUrl] = wallet
	return wallet
}

async function getCurrentKeySetId(mintUrl: string) {
	const wallet = await getWallet(mintUrl)
	l({ wallet })
	const keys = await (await getWallet(mintUrl)).mint.getKeys()
	const keySetId = deriveKeysetId(keys)
	_setKeys(mintUrl, keys, keySetId)
	return keySetId
}

export function getMintCurrentKeySetId(mintUrl: string) {
	return getCurrentKeySetId(mintUrl)
}

export function getMintKeySetIds(mintUrl: string) {
	return CashuMint.getKeySets(mintUrl)
}

export function getMintInfo(mintUrl: string) {
	return CashuMint.getInfo(mintUrl)
}

export async function isTokenSpendable(token: string) {
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

export async function checkProofsSpent(mintUrl: string, toCheck: { secret: string }[]) {
	return (await getWallet(mintUrl)).checkProofsSpent(toCheck)
}

export async function checkFees(mintUrl: string, invoice: string) {
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
	const { token, tokensWithErrors, newKeys } = await wallet.receive(encodedToken)
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
	return true
}

export async function requestMint(mintUrl: string, amount: number) {
	const wallet = await getWallet(mintUrl)
	const result = await wallet.requestMint(amount)
	await addInvoice({ amount, mintUrl, ...result })
	runRequestTokenLoop()
	l('[requestMint]', { result, mintUrl, amount })
	return result
}

export async function requestToken(mintUrl: string, amount: number, hash: string) {
	const invoice = await getInvoice(hash)
	const wallet = await getWallet(mintUrl)
	const { proofs, newKeys } = await wallet.requestTokens(amount, hash)
	l('[requestToken]', { proofs, mintUrl, amount, hash })
	if (newKeys) { _setKeys(mintUrl, newKeys) }
	await addToken({ token: [{ mint: mintUrl, proofs }] })
	await delInvoice(hash)
	return { success: true, invoice }
}

export async function payLnInvoice(mintUrl: string, invoice: string, fee: number, proofs: Proof[] = []) {
	const wallet = await getWallet(mintUrl)
	// const fee = await wallet.getFee(invoice)
	// l({ fee })
	const decoded = getDecodedLnInvoice(invoice)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const amount = decoded.sections[2]!.value as number / 1000
	const amountToPay = amount + fee
	if (!proofs?.length) {
		const { proofsToUse } = await getProofsToUse(mintUrl, amountToPay)
		proofs = proofsToUse
	}
	// l({ amountToPay })
	const { send, returnChange, newKeys } = await wallet.send(amountToPay, proofs)
	// l({ send })
	if (newKeys) { _setKeys(mintUrl, newKeys) }
	// add change back to db
	if (returnChange.length) { await addToken({ token: [{ mint: mintUrl, proofs: returnChange }] }) }
	if (send?.length) { await deleteProofs(proofs) }
	try {
		const result = await wallet.payLnInvoice(invoice, send, fee)
		// l('[payLnInvoice]', { result, mintUrl, amount })
		if (result?.newKeys) { _setKeys(mintUrl, result.newKeys) }
		if (result?.change?.length) { await addToken({ token: [{ mint: mintUrl, proofs: result.change }] }) }
		if (result.isPaid) {
			await deleteProofs(send)
		}
		l({ fee })
		l({ sumProofsValue: sumProofsValue(result.change) })
		l({ resultChange: result.change })
		return {
			result,
			error: undefined,
			fee,
			realFee: fee - result?.change?.length
				? sumProofsValue(result.change)
				: 0
		}
	} catch (error) {
		await addToken({ token: [{ mint: mintUrl, proofs: send }] })
		return { result: undefined, error }
	}
}

export async function sendToken(mintUrl: string, amount: number, memo: string, proofs: Proof[] = []) {
	const wallet = await getWallet(mintUrl)
	if (!proofs?.length) {
		const { proofsToUse } = await getProofsToUse(mintUrl, amount)
		proofs = proofsToUse
	}
	// will throw if not enough proofs are available
	const { send, returnChange, newKeys } = await wallet.send(amount, proofs)
	if (newKeys) { _setKeys(mintUrl, newKeys) }
	// add change back to db
	if (returnChange.length) { await addToken({ token: [{ mint: mintUrl, proofs: returnChange }] }) }
	await deleteProofs(proofs)
	return getEncodedToken({ token: [{ mint: mintUrl, proofs: send }], memo: memo.length > 0 ? memo : 'Sent via eNuts.' })
}

export async function autoMintSwap(
	srcMintUrl: string,
	destMintUrl: string,
	amount: number,
	fee: number,
	proofs: Proof[] = []
) {
	let { pr, hash } = await requestMint(destMintUrl, amount)
	// const fee = await checkFees(destMintUrl, pr)
	if (fee > 0) {
		// amount = amount + fee
		l('[autoMintSwap]', { fee, amount, srcMintUrl, destMintUrl })
		if (amount <= 0) {
			throw new Error('Swap Error: not enough funds')
		}
		const resp = await requestMint(destMintUrl, amount)
		pr = resp.pr
		hash = resp.hash
	}
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

export async function fullAutoMintSwap(srcMintUrl: string, destMintUrl: string, fee: number) {
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
}

let isRequestTokenLoopRunning = false
let loopHandel: NodeJS.Timeout
export function runRequestTokenLoop() {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	loopHandel = setTimeout(requestTokenLoop, 60000)
}

async function requestTokenLoop() {
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
		} catch (_) {/* ignore */ }
		const decoded = getDecodedLnInvoice(invoice.pr)
		const date = new Date((invoice.time * 1000) + (decoded.expiry * 1000)).getTime()
		// eslint-disable-next-line no-await-in-loop
		if (Date.now() > date) { await delInvoice(invoice.hash) }
	}
	isRequestTokenLoopRunning = false
}
