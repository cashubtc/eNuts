import Config from '@src/config'
import { l } from '@src/logger'
import { type IProfileContent } from '@src/model/nostr'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { TTLCache } from '@src/storage/store/ttl'
import { isArr, uniq } from '@src/util'
import type { Event as NostrEvent } from 'nostr-tools'

import { relay } from './class/Relay'
import { EventKind } from './consts'
import { filterFollows, parseProfileContent, parseUserRelays } from './util'

export interface IOnProfilesChangedHandler {
  (
    profiles: { [k: string]: { profile: IProfileContent; createdAt: number } },
  ): void;
}
export interface IOnContactsChangedHandler {
  (
    contacts: { list: string[]; createdAt: number },
  ): void;
}

export interface IOnUserMetadataChangedHandler {
  (
    profile: { profile: IProfileContent; createdAt: number },
  ): void;
}
export interface INostrDataUser {
  hex: string;
  relays: { read: string[]; write: string[]; createdAt: number };
  contacts: { list: string[]; createdAt: number };
}
export class NostrData {
	get hex(){return this.#user.hex}
	#ttlCache = new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24)
	#onProfilesChanged?: IOnProfilesChangedHandler
	#onContactsChanged?: IOnContactsChangedHandler
	#onUserMetadataChanged?: IOnUserMetadataChangedHandler
	#profiles: { [k: string]: { profile: IProfileContent; createdAt: number } } =
		{}
	#user: INostrDataUser
	constructor(
		userHex: string,
		{
			onProfilesChanged,
			onContactsChanged,
			onUserMetadataChanged,
		}: {
      onProfilesChanged?: IOnProfilesChangedHandler;
      onContactsChanged?: IOnContactsChangedHandler;
      onUserMetadataChanged?: IOnUserMetadataChangedHandler;
    },
	) {
		this.#user = {
			hex: userHex,
			relays: { read: [], write: [], createdAt: 0 },
			contacts: { list: [], createdAt: 0 },
		}
		this.#onProfilesChanged = onProfilesChanged
		this.#onContactsChanged = onContactsChanged
		this.#onUserMetadataChanged = onUserMetadataChanged
	}
	#parseRelays(e: NostrEvent) {
		if (
			+e.kind === EventKind.Relays && e.created_at > this.#user.relays.createdAt
		) {
			this.#user.relays = e.tags.reduce<INostrDataUser['relays']>(
				(acc, cur) => {
					// do we need this ifs
					if (!isArr(acc?.read)) {acc.read = []}
					if (!isArr(acc?.write)) {acc.write = []}
					const [, relay, type] = cur
					if (type === 'read') {
						if (!acc.read.includes(relay)) {acc.read.push(relay)}
					} else if (type === 'write') {
						if (!acc.write.includes(relay)) {acc.write.push(relay)}
					} else {
						if (!acc.read.includes(relay)) {acc.read.push(relay)}
						if (!acc.write.includes(relay)) {acc.write.push(relay)}
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
			relayUrls: userRelays,
			authors: [this.#user.hex],
			kinds: [EventKind.Metadata, EventKind.ContactList, EventKind.Relays],
			skipVerification: Config.skipVerification,
		})
		let latestRelays = 0 // createdAt
		sub?.on('event', async (e: NostrEvent) => {
			if (+e.kind === EventKind.Relays) {this.#parseRelays(e)}
			if (+e.kind === EventKind.Metadata) {
				const cached = await this.#ttlCache.getObj<
          { profile: IProfileContent; createdAt: number }
        >(this.#user.hex)
				if (cached) {
					l('cache hit')
					this.#profiles[this.#user.hex] = cached
					this.#onProfilesChanged?.(this.#profiles)
					this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
					return
				}
				const p = this.#profiles[this.#user.hex]
				if (!p || e.created_at > p.createdAt) {
					this.#profiles[this.#user.hex] = {
						profile: parseProfileContent(e),
						createdAt: e.created_at,
					}
					this.#onUserMetadataChanged?.(this.#profiles[this.#user.hex])
				}
			}
			if (+e.kind === EventKind.ContactList) {
				// TODO do we still need this???
				if (!userRelays && e.created_at > latestRelays) {
					// TODO user relays should be updated (every day?)
					const relays = parseUserRelays(e.content)
					latestRelays = e.created_at
					await store.setObj(STORE_KEYS.relays, relays)
				}
				if (e.created_at > this.#user.contacts.createdAt) {
					this.#user.contacts.list = filterFollows(e.tags)
					this.#onContactsChanged?.(this.#user.contacts)
				}
			}
		})
	}
	public async setupMetadataSub(hex: string) {
		if (!hex) {return}
		const e = await this.#ttlCache.getObj<
      { profile: IProfileContent; createdAt: number }
    >(hex)
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
		const sub = relay.subscribePool({
			relayUrls: uniq([...this.#user.relays.read, ...this.#user.relays.write]),
			authors: [hex],
			kinds: [EventKind.Metadata],
			skipVerification: Config.skipVerification,
		})
		sub?.on('event', async (e: NostrEvent) => {
			if (+e.kind === EventKind.Metadata) {
				const p = this.#profiles[hex]
				if (!p || e.created_at > p.createdAt) {
					this.#profiles[hex] = {
						profile: parseProfileContent(e),
						createdAt: e.created_at,
					}
					await this.#ttlCache.setObj(hex, this.#profiles[hex])
					this.#onProfilesChanged?.(this.#profiles)
					if (hex === this.#user.hex) {
						this.#onUserMetadataChanged?.(this.#profiles[hex])
					}
          
				}
			}
		})
	}
}
