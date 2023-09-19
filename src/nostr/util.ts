import type { IProfileContent } from '@model/nostr'
import { cTo } from '@store/utils'
import { Event as NostrEvent } from 'nostr-tools'

/**
 * Get a huge list of available relays
 */
export async function getRelays() {
	return (await fetch('https://api.nostr.watch/v1/online')).json<Promise<string[]>>() 
}

/**
 * Converts a NIP05 to an URL using name and domain identifier: `https://${domain}/.well-known/nostr.json?name=${name}`
 */
export function nip05toURL(identifier: string) {
	const [name, domain] = identifier.split('@')
	return `https://${domain}/.well-known/nostr.json?name=${name}`
}

/**
 * Converts a NIP-05 identifier to a website URL.
 *
 * @param identifier - The NIP-05 identifier to be converted.
 * @returns The website URL formed from the identifier's domain.
 */
export function nip05toWebsite(identifier: string) {
	const domain = identifier.split('@')[1]
	return `https://${domain}`
}

/**
 * JSON.parse the nostr user profile metadata
 */
export function parseProfileContent(event: NostrEvent) {
	return cTo<IProfileContent>(event.content)
}

/**
 * Filters out the hashtag follows
 */
export function filterFollows(tags: string[][]) {
	return tags.filter(t => t[0] === 'p').map(t => t[1])
}

/**
 * JSON.parse the nostr relays from user
 */
export function parseUserRelays(relays: string) {
	return Object.keys(cTo(relays))
}

/**
 * Truncates the npub of a user
 */
export function truncateNpub(npub: string) {
	return npub.substring(0, 8) + ':' + npub.substring(npub.length - 8, npub.length)
}

/**
 * Truncates a string while preserving emojis.
 *
 * @param about - The input string to be truncated.
 * @param maxLength - The maximum length of the truncated string.
 * @returns The truncated string.
 */
export function truncateNostrProfileInfo(str: string, maxLength = 20) {
	if (str.length <= maxLength) { return str }
	const truncated = [...str].reduce((result, char) => {
		if (result.length < maxLength) {
			result += char
		}
		return result
	}, '')
	return truncated + (str.length > maxLength ? '...' : '')
}

/**
 * Retrieves the username from a profile contact object, prioritizing different properties.
 *
 * @param contact - The profile contact object to extract the username from.
 * @returns The extracted username. Returns an empty string if no username is found.
 */
export function getNostrUsername(contact?: IProfileContent) {
	return contact?.displayName || contact?.display_name || contact?.username || contact?.name || ''
}
