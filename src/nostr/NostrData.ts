import Config from '@src/config'
import { l } from '@src/logger'
import { type IProfileContent } from '@src/model/nostr'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { TTLCache } from '@src/storage/store/ttl'
import { isArr, uniq } from '@src/util'
import type { Event as NostrEvent } from 'nostr-tools'

import { relay } from './class/Relay'
import { defaultRelays, EventKind } from './consts'
import { filterFollows, parseProfileContent, parseUserRelays } from './util'

export interface IOnProfilesChangedHandler {
	(profiles: { [k: string]: { profile: IProfileContent; createdAt: number } }): void
}
export interface IOnContactsChangedHandler {
	(contacts: { list: string[]; createdAt: number }): void
}

export interface IOnUserMetadataChangedHandler {
	(profile: { profile: IProfileContent; createdAt: number }): void
}
export interface INostrDataUser {
	hex: string;
	relays: { read: string[]; write: string[]; createdAt: number }
	contacts: { list: string[]; createdAt: number }
}
export class NostrData {
	get hex(): Readonly<string> { return this.#user.hex }
	get profile(): Readonly<{ profile: IProfileContent; createdAt: number; }> { return this.#profiles[this.#user.hex] }
	get profiles(): Readonly<{ [k: string]: { profile: IProfileContent; createdAt: number } }> { return this.#profiles }
	get relays(): Readonly<{ read: string[]; write: string[]; createdAt: number }> { return this.#user.relays }
	get user(): Readonly<INostrDataUser> { return this.#user }
	#ttlCache = new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24)
	#onProfilesChanged?: IOnProfilesChangedHandler
	#onContactsChanged?: IOnContactsChangedHandler
	#onUserMetadataChanged?: IOnUserMetadataChangedHandler
	#profiles: { [k: string]: { profile: IProfileContent; createdAt: number } } = {}
	#userRelays: string[] = []
	#user: INostrDataUser
	constructor(
		userHex: string,
		{
			onProfilesChanged,
			onContactsChanged,
			onUserMetadataChanged,
			userRelays
		}: {
			onProfilesChanged?: IOnProfilesChangedHandler,
			onContactsChanged?: IOnContactsChangedHandler,
			onUserMetadataChanged?: IOnUserMetadataChangedHandler,
			userRelays?: string[]
		},
	) {
		this.#user = {
			hex: userHex,
			relays: { read: [], write: [], createdAt: 0 },
			contacts: { list: [], createdAt: 0 },
		}
		this.#userRelays = this.#userRelays ?? []
		this.#onProfilesChanged = onProfilesChanged
		this.#onContactsChanged = onContactsChanged
		this.#onUserMetadataChanged = onUserMetadataChanged
		void this.initUserData(userRelays)
	}
	#parseRelays(e: NostrEvent) {
		if (
			+e.kind === EventKind.Relays && e.created_at > this.#user.relays.createdAt
		) {
			this.#user.relays = e.tags.reduce<INostrDataUser['relays']>(
				(acc, cur) => {
					// do we need this ifs
					if (!isArr(acc?.read)) { acc.read = [] }
					if (!isArr(acc?.write)) { acc.write = [] }
					const [, relay, type] = cur
					if (type === 'read') {
						if (!acc.read.includes(relay)) { acc.read.push(relay) }
					} else if (type === 'write') {
						if (!acc.write.includes(relay)) { acc.write.push(relay) }
					} else {
						if (!acc.read.includes(relay)) { acc.read.push(relay) }
						if (!acc.write.includes(relay)) { acc.write.push(relay) }
					}
					return acc
				},
				{ read: [], write: [], createdAt: e.created_at },
			)
		}
		this.#userRelays = this.mergeRelays([])
		void this.#ttlCache.setObj('relays', this.#userRelays)
	}
	async #loadCached() {
		// TODO refactor
		const keys = Object.keys(this.#profiles)
		await Promise.allSettled(
			this.#user.contacts.list
				.filter(x => !keys.includes(x))
				.map(async x => {
					const p = await this.#ttlCache.getObj<{ profile: IProfileContent, createdAt: number }>(x)
					if (p) { this.#profiles[x] = p }
				})
		)
		this.#onProfilesChanged?.(this.#profiles)
	}
	mergeRelays(relays: string[]) {
		return uniq([
			'wss://purplepag.es',
			...this.#user.relays.read,
			...this.#user.relays.write,
			...this.#userRelays,
			...relays
		])
	}
	public async initUserData(userRelays?: string[]) {
		const cachedUser = await this.#ttlCache.get('userHex')
		if (cachedUser && cachedUser !== this.#user.hex) {
			await Promise.allSettled([
				this.#ttlCache.delete('contacts'),
				this.#ttlCache.delete('relays')
			])
		} else { void this.#ttlCache.set('userHex', this.#user.hex) }
		const e = await this.#ttlCache.getObj<{ profile: IProfileContent; createdAt: number }>(this.#user.hex)
		if (e) {
			l('cache hit')
			this.#profiles[this.#user.hex] = e
			this.#onProfilesChanged?.(this.#profiles)
			this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
		}
		const cachedContacts = await this.#ttlCache.getObj<{ list: string[], createdAt: number }>('contacts')
		if (cachedContacts) {
			l('cache hit contacts', cachedContacts)
			this.#user.contacts = cachedContacts
			this.#onContactsChanged?.(this.#user.contacts)
			void this.#loadCached()
		}
		const cachedRelays = await this.#ttlCache.getObj<string[]>('relays')
		if (cachedRelays) { this.#userRelays = this.mergeRelays(cachedRelays) }
		let relays = this.mergeRelays([])
		if (relays.length < 2) { relays = defaultRelays }
		l('relays we use in init', relays)
		const sub = relay.subscribePool({
			relayUrls: relays,
			authors: [this.#user.hex],
			kinds: [EventKind.Metadata, EventKind.ContactList, EventKind.Relays],
			skipVerification: Config.skipVerification,
		})
		let latestRelays = 0 // createdAt
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.Relays) { this.#parseRelays(e) }
			if (+e.kind === EventKind.Metadata) {
				const p = this.#profiles[this.#user.hex]
				if (!p || e.created_at > p.createdAt) {
					this.#profiles[this.#user.hex] = {
						profile: parseProfileContent(e),
						createdAt: e.created_at,
					}
					this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
					void this.#ttlCache.setObj(this.#user.hex, this.#profiles[this.#user.hex])
				}
			}
			if (+e.kind === EventKind.ContactList) {
				// TODO do we still need this???
				if (!userRelays && e.created_at > latestRelays) {
					// TODO user relays should be updated (every day?)
					const relays = this.mergeRelays(parseUserRelays(e.content))
					latestRelays = e.created_at
					void store.setObj(STORE_KEYS.relays, relays)
					this.#userRelays = relays
					void this.#ttlCache.setObj('relays', relays)
				}
				if (e.created_at > this.#user.contacts.createdAt) {
					this.#user.contacts.list = filterFollows(e.tags)
					this.#user.contacts.createdAt = e.created_at
					this.#onContactsChanged?.(this.#user.contacts)
					void this.#ttlCache.setObj('contacts', this.#user.contacts)
					void this.#loadCached()
				}
			}
		})
	}
	public async setupMetadataSub(hex: string) {
		if (!hex || this.#profiles[hex]?.profile) { return }
		const e = await this.#ttlCache.getObj<{ profile: IProfileContent; createdAt: number }>(hex)
		if (e) {
			l('cache hit')
			this.#profiles[hex] = e
			this.#onProfilesChanged?.(this.#profiles)
			if (hex === this.#user.hex) {
				this.#onUserMetadataChanged?.(this.#profiles[hex])
			}
			return
		}
		l('cache miss')
		let relays = this.mergeRelays([])
		if (relays.length < 2) { relays = defaultRelays }
		const sub = relay.subscribePool({
			relayUrls: relays,
			authors: [hex],
			kinds: [EventKind.Metadata],
			skipVerification: Config.skipVerification,
		})
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind !== EventKind.Metadata) { return }
			const p = this.#profiles[hex]
			if (!p || e.created_at > p.createdAt) {
				this.#profiles[hex] = {
					profile: parseProfileContent(e),
					createdAt: e.created_at,
				}
				void this.#ttlCache.setObj(hex, this.#profiles[hex])
				this.#onProfilesChanged?.(this.#profiles)
				if (hex === this.#user.hex) {
					this.#onUserMetadataChanged?.(this.#profiles[hex])
				}
			}
		})
	}
}
