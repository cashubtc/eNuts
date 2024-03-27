import { decodeInvoice, getDecodedToken } from '@cashu/cashu-ts'
import { l } from '@log'
import type { ILnUrl, IMintBalWithName, IProofSelection } from '@model'
import { IContact } from '@src/model/nostr'
import { Buffer } from 'buffer/'
import * as Clipboard from 'expo-clipboard'
import { Linking, Share, Vibration } from 'react-native'

import { decodeUrlOrAddress, isLnurlOrAddress, isUrl } from './lnurl'
import { getLanguageCode } from './localization'
import { isArr, isStr } from './typeguards'

export { isArr, isArrOf, isArrOfNonNullable, isArrOfNum, isArrOfObj, isArrOfStr, isBool, isBuf, isErr, isFunc, isNonNullable, isNull, isNum, isObj, isStr, isUndef } from './typeguards'

export function unixTimestamp() { return Math.ceil(new Date().getTime() / 1000) }

/**
 * Return the unique values found in the passed iterable
 */
export function uniq<T extends string | number | bigint | boolean | symbol>(iter: Iterable<T>) {
	return [...new Set(iter)]
}

export function uniqByIContacts(iter: Iterable<IContact>, key: keyof IContact) {
	// l()
	const o = [...iter].reduce<{ [k: string | number | symbol]: IContact }>((acc, cur) => {
		const hex = cur?.[key]
		if (!hex) { return acc }
		if (!acc[hex] || Object.keys(cur).length > Object.keys(acc[hex]).length) {
			// l({ cur, hex, accItem: acc[hex] })
			acc[hex] = cur
			return acc
		}
		return acc
	}, {})
	// l({o})
	return Object.values(o)
}
export function clearArr<T extends U[], U>(array: T) { array.length = 0 }

export function sleep(ms: number) { return new Promise<void>(resolve => setTimeout(resolve, ms)) }

export function formatBalance(bal: number) { return (bal / 100_000_000).toFixed(8) }

/**
 * format a number to a string with a given locale. Compact notation is not yet supported for all locales.
 *
 * if locale is not specified, the current locale is used
 *
 * @export
 * @param {number} val number to format
 * @param {('standard' | 'engineering' | 'scientific' | 'compact')} [notation='standard'] 'standard' | 'engineering' | 'scientific' | 'compact'
 * @param {string} [locale] optional defaults to the current locale
 * @returns {string}  formatted string representation of the number
 */
export function formatInt(
	val: number,
	notation: 'standard' | 'engineering' | 'scientific' | 'compact' = 'standard',
	locale?: string,
): string {
	try {
		const lan = getLanguageCode()
		// eslint-disable-next-line new-cap
		const numberFormatter = Intl.NumberFormat(locale || lan, { notation })
		return numberFormatter.format(val)
	} catch (e) {
		l(e)
		return val.toLocaleString()
	}
}

/**
 * Generates a short date string representation based on the provided date.
 *
 * @param date - The date for which the short date string is generated.
 * @returns A short date string representation f.E: "Mo., 17. Aug. 23"
 */
export function getShortDateStr(date: Date) {
	return date.toLocaleDateString(getLanguageCode(), {
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

export function formatMintUrl(url: string) {
	const clean = url.startsWith('http') ? url.split('://')[1] : url
	if (clean.length < 30) { return clean }
	const u = new URL(url)
	return `${u.hostname.slice(0, 25)}...${u.pathname.slice(-10)}`
}

/**
 * @param time a number in seconds
 * @returns the following format: 00:00
 */
export function formatSeconds(time: number) {
	const minutes = Math.floor(time / 60)
	const seconds = time % 60
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function getSelectedAmount(proofs: IProofSelection[]) {
	return proofs.reduce((acc, p) => acc + (p.selected ? p.amount : 0), 0)
}

export function vib(pattern?: number | number[]) {
	Vibration.vibrate(pattern)
}

export function hasTrustedMint(userMints: string[], tokenMints: string[]): boolean

export function hasTrustedMint(userMints: { mintUrl: string }[], tokenMints: string[]): boolean

export function hasTrustedMint(uMints: ({ mintUrl: string } | string)[], tMints: string[]) {
	if (!uMints?.length || !isArr(uMints) || !tMints?.length || !isArr(tMints)) { return false }
	return uMints.some(m => tMints.includes(isStr(m) ? m : m.mintUrl))
}

export async function getInvoiceFromLnurl(lnUrlOrAddress: string, amount: number) {
	try {
		lnUrlOrAddress = lnTrim(lnUrlOrAddress)
		if (!isLnurlOrAddress(lnUrlOrAddress)) { throw new Error('invalid address') }
		const url = decodeUrlOrAddress(lnUrlOrAddress)
		if (!url || !isUrl(url)) { throw new Error('Invalid lnUrlOrAddress') }
		amount *= 1000
		const resp = await fetch(url)
		const { tag, callback, minSendable, maxSendable } = await resp.json<ILnUrl>()
		// const { tag, callback, minSendable, maxSendable } = await (await fetch(`https://${host}/.well-known/lnurlp/${user}`)).json<ILnUrl>()
		if (tag === 'payRequest' && minSendable <= amount && amount <= maxSendable) {
			const resp = await fetch(`${callback}?amount=${amount}`)
			const { pr } = await resp.json<{ pr: string }>()
			// const resp = await (await fetch(`${callback}?amount=${amount}`)).json<{ pr: string }>()
			if (!pr) { l('[getInvoiceFromLnurl]', { resp }) }
			return pr || ''
		}
	} catch (err) { l('[getInvoiceFromLnurl]', err) }
	return ''
}

export function isCashuToken(token: string) {
	if (!token || !isStr(token)) { return }
	token = token.trim()
	const idx = token.indexOf('cashuA')
	if (idx !== -1) { token = token.slice(idx) }
	const uriPrefixes = [
		'https://wallet.nutstash.app/#',
		'https://wallet.cashu.me/?token=',
		'web+cashu://',
		'cashu://',
		'cashu:'
	]
	uriPrefixes.forEach((prefix) => {
		if (!token.startsWith(prefix)) { return }
		token = token.slice(prefix.length).trim()
	})
	if (!token) { return }
	try { getDecodedToken(token.trim()) } catch (_) { return }
	return token.trim()
}

export function lnTrim(str: string) {
	if (!str || !isStr(str)) { return '' }
	str = str.trim().toLowerCase()
	const uriPrefixes = [
		'lightning:',
		'lightning=',
		'lightning://',
		'lnurlp://',
		'lnurlp=',
		'lnurlp:',
		'lnurl:',
		'lnurl=',
		'lnurl://'
	]
	uriPrefixes.forEach((prefix) => {
		if (!str.startsWith(prefix)) { return }
		str = str.slice(prefix.length).trim()
	})
	return str.trim()
}

export function isLnInvoice(str: string) {
	if (!str || !isStr(str)) { return }
	str = lnTrim(str)
	if (!str) { return }
	if (isLnurlOrAddress(str.trim())) {return str.trim()}
	try { decodeInvoice(str.trim()) } catch (_) { return }
	return str.trim()
}

export function extractStrFromURL(url?: string) {
	try {
		const u = new URL(url || '')
		return u.hostname || u.pathname
	} catch (e) {
		return url
	}
}

export function* arrToChunks<T extends T[number][]>(arr: T, n: number) {
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

export function decodeLnInvoice(invoice: string) {
	const x = decodeInvoice(invoice)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const amount = x.amountInMSats
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const timestamp = x.timestamp
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const expiry = x.expiry
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const memo = x.memo
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const paymentHash = x.paymentHash
	const timePassed = unixTimestamp() - timestamp
	const timeLeft = expiry - timePassed
	return {
		decoded: x,
		amount: amount / 1000,
		timestamp,
		expiry,
		timeLeft,
		memo,
		paymentHash
	}
}

export function cleanUpNumericStr(str: string) {
	if (str.startsWith('0')) { return '' }
	return str.replace(/\D/g, '')
}

export function openUrl(url: string) {
	if (!url?.trim() || !isUrl(url)) { return }
	return Linking.openURL(url)
}

export async function copyStrToClipboard(str: string) {
	await Clipboard.setStringAsync(str)
}

export async function getStrFromClipboard() {
	try {
		if (!await Clipboard.hasStringAsync()) { return null }
		const s = await Clipboard.getStringAsync()
		return !s || s === 'null' ? null : s
	} catch (error) { l('[getStrFromClipboard]', error) }
	return null
}

export async function share(message: string, url?: string) {
	try {
		const res = await Share.share({ message, url })
		if (res.action === Share.sharedAction) {
			if (res.activityType) {
				// shared with activity type of result.activityType
				return l('shared with activity type of result.activityType')
			}
			// shared
			return l('shared')
		}
		if (res.action === Share.dismissedAction) {
			// dismissed
			l('sharing dismissed')
		}
	} catch (e) {
		l('[quick-share error] ', e)
	}
}

export function normalizeMintUrl(url: string) {
	const res = url.startsWith('https://') ? url : `https://${url}`
	if (!isUrl(res)) { return }
	return res
}

export function sortMintsByDefault(mints: IMintBalWithName[], defaultMint: string) {
	return mints.sort((a, b) => {
		if (a.mintUrl === defaultMint) { return -1 }
		if (b.mintUrl === defaultMint) { return 1 }
		// if neither 'a' nor 'b' is the default mint, sort by amount (descending)
		return b.amount - a.amount
	})
}

export function debounce<T extends (...args: any[]) => void>(
	func: T,
	timeout = 300
): (...args: Parameters<T>) => void {
	let timer: NodeJS.Timeout

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

export function formatSatStr(
	amount: number,
	notation: 'standard' | 'engineering' | 'scientific' | 'compact' = 'standard',
	showAmount = true
) {
	return `${showAmount ? `${formatInt(amount, notation, 'en')} ` : ' '}${amount < 2 && amount > -2 ? 'Sat' : 'Sats'}`
}

export function getUnixTimestampFromDaysAgo(days: number) {
	const oneDayInMs = 24 * 60 * 60 * 1000
	return Math.ceil(getUnixTimestamp() - days * oneDayInMs)
}

export function getUnixTimestamp() {
	return Math.ceil(new Date().getTime() / 1000)
}

export function withTimeout<T>(promis: Promise<T>, ms: number) {
	return Promise.race([
		promis,
		timeout<T>(ms),
	])
}

export async function timeout<T>(ms = 1000) {
	if (ms < 0) { return {} as unknown as T }// should never happen
	await sleep(ms)
	throw new Error(`promise was timed out in ${ms} ms, by withTimeout`)
}