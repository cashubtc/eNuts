import { getDecodedLnInvoice, getDecodedToken } from '@cashu/cashu-ts'
import type { ISectionEntry } from '@gandlaf21/bolt11-decode'
import { l } from '@log'
import type { ILnUrl, IProofSelection } from '@model'
import axios from 'axios'
import type { Buffer } from 'buffer/'
import * as Clipboard from 'expo-clipboard'
import { Linking, Vibration } from 'react-native'

import { getLanguageCode } from './localization'
import { isArr, isBuf, isNum, isStr } from './typeguards'

export { isArr, isArrOf, isArrOfNonNullable, isArrOfNum, isArrOfObj, isArrOfStr, isBool, isBuf, isErr, isFunc, isNonNullable, isNull, isNum, isObj, isStr, isUndef } from './typeguards'

export function rndInt(min: number, max: number) { // min and max included
	return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Return the unique values found in the passed iterable
 */
export function uniq<T extends string | number | bigint | boolean | symbol>(iter: Iterable<T>) {
	return [...new Set(iter)]
}

export function clearArr<T extends U[], U>(array: T) { array.length = 0 }

/**
 * Removes an entry from an array while maintaining element order.
 *
 * @param arr - The array from which the entry should be removed.
 * @param idx - The index of the entry to be removed.
 */
export function rmArrEntry<T extends U[], U>(arr: T, idx: number) {
	if (idx < 0 || idx >= arr.length) { return }
	arr[idx] = arr[arr.length - 1]
	arr.pop()
}

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

export function isUrl(url: string) {
	try { return !!new URL(url) } catch { /* ignore*/ }
	return false
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

export function isLnurl(addr: string) {
	const [user, host] = addr.split('@')
	return addr.includes('.')
		&& addr.split('@').length === 2
		&& isUrl(`https://${host}/.well-known/lnurlp/${user}`)
}

export function hasTrustedMint(userMints: string[], tokenMints: string[]): boolean

export function hasTrustedMint(userMints: { mintUrl: string }[], tokenMints: string[]): boolean

export function hasTrustedMint(uMints: ({ mintUrl: string } | string)[], tMints: string[]) {
	if (!uMints?.length || !isArr(uMints) || !tMints?.length || !isArr(tMints)) { return false }
	return uMints.some(m => tMints.includes(isStr(m) ? m : m.mintUrl))
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

export function cleanUpNumericStr(str: string) {
	if (str.startsWith('0')) { return '' }
	return str.replace(/\D/g, '')
}

export function openUrl(url: string) {
	if (!url?.trim()) { return }
	return Linking.openURL(url)
}

/**
 * Searches for a target value in a sorted array using binary search,
 * and optionally inserts the target value if not found.
 *
 * @param arr - The sorted array to search or insert into.
 * @param target - The value to search for or insert.
 * @param shouldInsert Optional, Specifies whether to insert the target if not found.
 * @returns If `shouldInsert` is false, returns `true` if target found, or `false` if not found.
 * If `shouldInsert` is true, returns the index where target is inserted, or `-1` if the target already exists.
 */
export function binarySearchAndInsert(arr: string[], target: string, shouldInsert = false) {
	let left = 0, right = arr.length - 1
	while (left <= right) {
		// bit-wise right shift operation
		const mid = (left + right) >> 1
		const midValue = arr[mid]
		if (midValue === target) { return shouldInsert ? mid : true }
		if (midValue < target) { left = mid + 1 }
		else { right = mid - 1 }
	}
	return shouldInsert ? left : false
}

// helper without flag
export function binarySearch(arr: string[], target: string) {
	return binarySearchAndInsert(arr, target) as boolean
}

// helper with flag
export function binaryInsert(arr: string[], newStr: string): void {
	const insertionIndex = binarySearchAndInsert(arr, newStr, true)
	if (isNum(insertionIndex)) {
		arr.splice(insertionIndex, 0, newStr)
	}
}

// For arrays smaller than 10 elements, a linear search is often
// simpler and faster due to the reduced overhead. Only when you start to deal with larger datasets,
// such as hundreds or thousands of elements, does binary search's efficiency start to shine.
export function hasEventId(arr: string[], target: string) {
	if (arr.length < 40) {
		return arr.some(x => x === target)
	}
	return binarySearch(arr, target)
}

export async function copyStrToClipboard(str: string) {
	await Clipboard.setStringAsync(str)
}

export async function getStrFromClipboard() {
	const s = await Clipboard.getStringAsync()
	return !s || s === 'null' ? null : s
}