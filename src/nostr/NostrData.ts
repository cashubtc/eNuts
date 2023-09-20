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
		this.initUserData(userRelays)
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
	}
	public initUserData(userRelays?: string[]) {
		// if (!hex /* || (userProfile && contacts.length) */) {
		//   l("no pubKey or user data already available");
		//   // stopLoading();
		//   return;
		// }
		// TODO use cache if available
		const sub = relay.subscribePool({
			relayUrls: uniq([...this.#user.relays.read, ...this.#user.relays.write, ...this.#userRelays]),
			authors: [this.#user.hex],
			kinds: [EventKind.Metadata, EventKind.ContactList, EventKind.Relays],
			skipVerification: Config.skipVerification,
		})
		let latestRelays = 0 // createdAt
		sub?.on('event', async (e: NostrEvent) => {
			if (+e.kind === EventKind.Relays) { this.#parseRelays(e) }
			if (+e.kind === EventKind.Metadata) {
				const cached = await this.#ttlCache.getObj<{ profile: IProfileContent, createdAt: number }>(this.#user.hex)
				if (cached) {
					l('cache hit')
					this.#profiles[this.#user.hex] = cached
					this.#onProfilesChanged?.(this.#profiles)
					this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
					return
				}
				l({ profiles: this.#profiles })
				l({ user: this.#user })
				const p = this.#profiles[this.#user.hex]
				l({ p })
				if (!p || e.created_at > p.createdAt) {
					this.#profiles[this.#user.hex] = {
						profile: parseProfileContent(e),
						createdAt: e.created_at,
					}
					l(this.#onUserMetadataChanged)
					this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
					// TODO set cache
				}
			}
			if (+e.kind === EventKind.ContactList) {
				// TODO do we still need this???
				if (!userRelays && e.created_at > latestRelays) {
					// TODO user relays should be updated (every day?)
					const relays = parseUserRelays(e.content)
					latestRelays = e.created_at
					void store.setObj(STORE_KEYS.relays, relays)
					this.#userRelays = uniq([...relays, ...this.#userRelays])
				}
				if (e.created_at > this.#user.contacts.createdAt) {
					// TODO set cache
					this.#user.contacts.list = filterFollows(e.tags)
					this.#user.contacts.createdAt = e.created_at
					this.#onContactsChanged?.(this.#user.contacts)

					// TODO refactor
					this.#user.contacts.list
						.filter(x => !Object.keys(this.#profiles).includes(x))
						.forEach(x => {
							void (async () => {
								const p = await this.#ttlCache.getObj<{ profile: IProfileContent, createdAt: number }>(x)
								if (p) { this.#profiles[x] = p }
							})()
						})
				}
			}
		})
	}
	public async setupMetadataSub(hex: string) {
		if (!hex) { return }
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
		let relays = uniq([...this.#user.relays.read, ...this.#user.relays.write, ...this.#userRelays])
		if (!relays.length) { relays = defaultRelays }
		const sub = relay.subscribePool({
			relayUrls: relays,
			authors: [hex],
			kinds: [EventKind.Metadata],
			skipVerification: Config.skipVerification,
		})
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.Metadata) {
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
			}
		})
	}
}
