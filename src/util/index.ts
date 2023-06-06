import { getDecodedLnInvoice, getDecodedToken } from '@cashu/cashu-ts'
import type { ISectionEntry } from '@gandlaf21/bolt11-decode'
import { l } from '@log'
import type { ILnUrl, IProofSelection } from '@model'
import axios from 'axios'
import { Buffer } from 'buffer/'
import { Linking, Vibration } from 'react-native'

import { getLanguageCode } from './localization'
import { isBuf, isNum, isStr } from './typeguards'

export {
	isArr, isArrayOf, isBool, isBuf, isErr, isFunc,
	isNonNullable, isNull, isNum, isObj, isStr, isUndef
} from './typeguards'

export function rndInt(min: number, max: number) { // min and max included
	return Math.floor(Math.random() * (max - min + 1) + min)
}
export function sleep(ms: number) { return new Promise<void>(resolve => setTimeout(resolve, ms)) }

export function formatBalance(bal: number) { return (bal / 100_000_000).toFixed(8) }
/**
 * format a number to a string with a given locale
 *
 * if locale is not specified, the current locale is used
 *
 * @export
 * @param {number} val number to format
 * @param {string} [locale] optional defaults to the current locale
 * @param {('standard' | 'engineering' | 'scientific' | 'compact')} [notation='standard'] 'standard' | 'engineering' | 'scientific' | 'compact'
 * @returns {string}  formatted string representation of the number
 */
export function formatInt(
	val: number,
	locale?: string,
	notation: 'standard' | 'engineering' | 'scientific' | 'compact' = 'standard'
): string {
	// eslint-disable-next-line new-cap
	const numberFormatter = Intl.NumberFormat(locale ? locale : getLanguageCode(), { notation })
	return numberFormatter.format(val)
}
export function getShortDateStr(date: Date) {
	return date.toLocaleDateString(undefined, {
		year: '2-digit',
		month: 'short',
		day: '2-digit',
		weekday: 'short',
	})
}
export function isToday(someDate: Date) {
	const today = new Date()
	return someDate.getDate() === today.getDate() &&
		someDate.getMonth() === today.getMonth() &&
		someDate.getFullYear() === today.getFullYear()
}
export function getHistoryGroupDate(date: Date) {
	return isToday(date) ? 'Today' : getShortDateStr(date)
}
export function isUrl(url: string) {
	try { return !!new URL(url) } catch { /* ignore*/ }
	return false
}
export function formatMintUrl(url: string) {
	if (url.length < 30) { return url }
	const u = new URL(url)
	return `${u.hostname.slice(0, 25)}...${u.pathname.slice(-10)}`
}
export function formatExpiry(time: number) {
	const minutes = Math.floor(time / 60)
	const seconds = time % 60
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
export function skipRoute(r: string) {
	return r !== 'root' &&
		r !== 'Contact' &&
		r !== 'Display settings' &&
		r !== 'Security settings' &&
		r !== 'BackupPage'
}
export function getSelectedAmount(proofs: IProofSelection[]) {
	return proofs.reduce((acc, p) => acc + (p.selected ? p.amount : 0), 0)
}
export function vib(pattern?: number | number[]) {
	Vibration.vibrate(pattern)
}
export function isLnurl(addr: string) {
	const [user, host] = addr.split('@')
	return addr.includes('.')
		&& addr.split('@').length === 2
		&& isUrl(`https://${host}/.well-known/lnurlp/${user}`)
}
/* export function cleanupMintUrl(mintUrl: string) {
	return mintUrl.replaceAll(/[\W]/gi, '')
} */
export function isTrustedMint(userMints: { mint_url: string }[], tokenMints: string[]) {
	return userMints.some(m => tokenMints.includes(m.mint_url))
}
export async function getInvoiceFromLnurl(address: string, amount: number) {
	try {
		if (!isLnurl(address)) { throw new Error('invalid address') }
		const [user, host] = address.split('@')
		amount *= 1000
		const { data: { tag, callback, minSendable, maxSendable } } = await axios.get<ILnUrl>(`https://${host}/.well-known/lnurlp/${user}`)
		if (tag === 'payRequest' && minSendable <= amount && amount <= maxSendable) {
			const resp = await axios.get<{ pr: string }>(`${callback}?amount=${amount}`)
			if (!resp?.data?.pr) { l('[getInvoiceFromLnurl]', { resp }) }
			return resp?.data?.pr || ''
		}
	} catch (err) { l('[getInvoiceFromLnurl]', err) }
	return ''
}
export function isCashuToken(token: string) {
	if (!token || !isStr(token)) { return }
	token = token.trim()
	const uriPrefixes = ['web+cashu://', 'cashu://', 'cashu:']
	uriPrefixes.forEach((prefix) => {
		if (!token.startsWith(prefix)) { return }
		token = token.slice(prefix.length).trim()
	})
	if (!token) { return }
	try { getDecodedToken(token.trim()) } catch (_) { return }
	return token.trim()
}
export function* arrToChunks<T>(arr: T[], n: number) {
	for (let i = 0; i < arr.length; i += n) {
		yield arr.slice(i, i + n)
	}
}
/**
 * This function is used to show a few TX info in the history entry details page
 * @param invoice The LN invoice
 */
export function getLnInvoiceInfo(invoice: string) {
	if (!invoice) { return { hash: '', memo: 'Mint new tokens test' } }
	const x = decodeLnInvoice(invoice)
	return { ...x, hash: x.paymentHash, memo: x.memo }
}

function getFromSection<T>(sections: ISectionEntry[], name: string, fn: (v: unknown) => boolean, toNum = false) {
	const section = sections.find(s => s?.name === name && s?.value && fn(s.value))
	return section?.value ?
		toNum ? +section.value as T : section.value as T
		: undefined
}
export function decodeLnInvoice(invoice: string) {
	const x = getDecodedLnInvoice(invoice)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const amount = getFromSection<number>(x.sections, 'amount', (v: unknown) => isStr(v) && isNum(+v), true)!
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const timestamp = getFromSection<number>(x.sections, 'timestamp', isNum)!
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const expiry = getFromSection<number>(x.sections, 'expiry', isNum)!
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const memo = getFromSection<string>(x.sections, 'description', isStr) || ''
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const paymentHash = getFromSection<Buffer>(x.sections, 'payment_hash', isBuf)?.toString('hex') || ''
	return {
		decoded: x,
		amount,
		timestamp,
		expiry,
		memo,
		paymentHash
	}
}
export function openLinkInBrowser(url: string) {
	return Linking.canOpenURL(url)
		.then((canOpen) => canOpen && Linking.openURL(url))
}