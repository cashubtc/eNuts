import type { ILnUrlPayRequest } from '@model'
import { bech32 } from 'bech32'
import { Buffer } from 'buffer/'

const LNURL_REGEX =
	/^(?:http.*[&?]lightning=|lightning:)?(lnurl[0-9]{1,}[02-9ac-hj-np-z]+)/

const LN_ADDRESS_REGEX =
	/^((?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const LNURLP_REGEX =
	/^lnurlp:\/\/([\w-]+\.)+[\w-]+(:\d{1,5})?(\/[\w-./?%&=]*)?$/

export interface LightningAddress {
	username: string
	domain: string
}

export function isUrl(url: string) {
	try { return !!new URL(url) } catch { /* ignore*/ }
	return false
}

export function isLnurlOrAddress(lnUrlOrAddress: string) {
	return (isLnurl(lnUrlOrAddress) || isLnurlAddress(lnUrlOrAddress))
}

export function isLnurlAddress(str: string) {
	const address = parseLightningAddress(str)
	if (address) {
		const { username, domain } = address
		const protocol = domain.endsWith('.onion') ? 'http' : 'https'
		return isUrl(`${protocol}://${domain}/.well-known/lnurlp/${username}`)
	}
	return false
}

export function isLnurl(str: string) {
	const bech32Url: string | null = parseLnUrl(str)
	if (bech32Url) { return true }
	const lnurlp = parseLnurlp(str)
	if (lnurlp) { return true }
	return false
}

/**
 * Parse an url and return a bech32 encoded url (lnurl)
 * @method parseLnUrl
 * @param  url string to parse
 * @return  bech32 encoded url (lnurl) or null if is an invalid url
 */
export const parseLnUrl = (url: string): string | null => {
	if (!url) { return null }
	const result = LNURL_REGEX.exec(url.toLowerCase())
	return result ? result[1] : null
}

/**
   * Verify if a string is a lightning adress
   * @method isLightningAddress
   * @param  address string to validate
   * @return  true if is a lightning address
   */
export const isLightningAddress = (address: string): boolean => {
	if (!address) { return false }
	return LN_ADDRESS_REGEX.test(address)
}

/**
   * Parse an address and return username and domain
   * @method parseLightningAddress
   * @param  address string to parse
   * @return  LightningAddress { username, domain }
   */
export const parseLightningAddress = (
	address: string
): LightningAddress | null => {
	if (!address) { return null }
	const result = LN_ADDRESS_REGEX.exec(address)
	return result ? { username: result[1], domain: result[2] } : null
}

/**
   * Verify if a string is a lnurlp url
   * @method isLnurlp
   * @param  url string to validate
   * @return  true if is a lnurlp url
   */
export const isLnurlp = (url: string): boolean => {
	if (!url) { return false }
	return LNURLP_REGEX.test(url)
}

/**
   * Parse a lnurlp url and return an url with the proper protocol
   * @method parseLnurlp
   * @param  url string to parse
   * @return  url (http or https) or null if is an invalid lnurlp
   */
export const parseLnurlp = (url: string): string | null => {
	if (!url) { return null }
	const parsedUrl = url.toLowerCase()
	if (!LNURLP_REGEX.test(parsedUrl)) { return null }
	const protocol = parsedUrl.includes('.onion') ? 'http://' : 'https://'
	return parsedUrl.replace('lnurlp://', protocol)
}

export const decodeUrlOrAddress = (lnUrlOrAddress: string): string | null => {
	const bech32Url = parseLnUrl(lnUrlOrAddress)
	if (bech32Url) {
		const decoded = bech32.decode(bech32Url, 20000)
		return Buffer.from(bech32.fromWords(decoded.words)).toString()
	}
	const address = parseLightningAddress(lnUrlOrAddress)
	if (address) {
		const { username, domain } = address
		const protocol = domain.match(/\.onion$/) ? 'http' : 'https'
		return `${protocol}://${domain}/.well-known/lnurlp/${username}`
	}
	return parseLnurlp(lnUrlOrAddress)
}

export function getLnurlData(url?: string): Promise<ILnUrlPayRequest> | null {
	if (!url) { return null }
	return fetch(url).then(res => res.json())
}

export function getLnurlIdentifierFromMetadata(metadata: string) {
	try {
		const parsed = JSON.parse(metadata) as string[][]
		const identidier = parsed.find(([key]) => key === 'text/identifier')?.[1]
		return identidier ?? 'Identifier not found'
	} catch (e) {
		return 'Error: Identifier not found'
	}
}