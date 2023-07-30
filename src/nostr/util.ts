import { cTo } from '@store/utils'
import { Event as NostrEvent } from 'nostr-tools'

export async function getRelays() {
	return (await fetch('https://api.nostr.watch/v1/online')).json() as Promise<string[]>
}

export function nip05toURL(identifier: string) {
	const [name, domain] = identifier.split('@')
	return `https://${domain}/.well-known/nostr.json?name=${name}`
}

export function parseProfileContent<T>(event: NostrEvent) {
	return cTo(event.content) as T
}

export function filterFollows(tags: string[][]) {
	return tags.filter(t => t[0] === 'p').map(t => t[1])
}

export function shortNpub(npub: string) {
	return npub.substring(0, 8) + ':' + npub.substring(npub.length - 8, npub.length)
}

export function shortAbout(about: string) {
	return `${about.slice(0, 30)}...`
}

/**
 * returns true if note is not a reply
 */
export function isNotReplyNote(tags: string[][]) {
	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i]
		if (tag[0] === 'e') {
			return false
		}
	}
	return true
}