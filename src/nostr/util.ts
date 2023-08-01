import { cTo } from '@store/utils'
import { Event as NostrEvent } from 'nostr-tools'

/**
 * Get a huge list of available relays
 */
export async function getRelays() {
	return (await fetch('https://api.nostr.watch/v1/online')).json() as Promise<string[]>
}

/**
 * Converts a NIP05 to an URL using name and domain identifier: `https://${domain}/.well-known/nostr.json?name=${name}`
 */
export function nip05toURL(identifier: string) {
	const [name, domain] = identifier.split('@')
	return `https://${domain}/.well-known/nostr.json?name=${name}`
}

/**
 * JSON.parse the nostr user profile metadata
 */
export function parseProfileContent<T>(event: NostrEvent) {
	return cTo(event.content) as T
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
export function parseUserRelays<T>(relays: string) {
	return Object.keys(cTo(relays)) as T
}

/**
 * Truncates the npub of a user
 */
export function truncateNpub(npub: string) {
	return npub.substring(0, 8) + ':' + npub.substring(npub.length - 8, npub.length)
}

/**
 * Truncates the nostr user about section
 * // TODO avoid truncating emojis
 */
export function truncateAbout(about: string) {
	if (about.length < 25) { return about }
	return `${about.slice(0, 25)}...`
}

/**
 * returns true if note is not a reply
 */
// export function isNotReplyNote(tags: string[][]) {
// 	for (let i = 0; i < tags.length; i++) {
// 		const tag = tags[i]
// 		if (tag[0] === 'e') {
// 			return false
// 		}
// 	}
// 	return true
// }