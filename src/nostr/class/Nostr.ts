import { l } from '@src/logger'
import { IContact, IProfileContent } from '@src/model/nostr'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { TTLCache } from '@src/storage/store/ttl'
import { isArr, uniq } from '@src/util'
import { Event, SubscriptionOptions } from 'nostr-tools'

import { defaultRelays, EventKind } from '../consts'
import { filterFollows, isHex, normalizeURL, parseUserRelays, shuffle } from '../util'
import { pool } from './Pool'
import { ProfileData } from './ProfileData'

export interface IOnProfileChangedHandler {
	(profiles?: IContact[]): void
}
export interface IOnContactsChangedHandler {
	(contacts: string[]): void
}
export interface IOnUserMetadataChangedHandler {
	(profile: IContact): void
}
export interface INostrDataUser {
	hex: string
	relays: { read: string[], write: string[], createdAt: number }
	contacts: { list: string[], createdAt: number }
}
export interface IProfileWithCreatedAtWithHex extends IProfileWithCreatedAt {
	hex: string
}
export interface IProfileWithCreatedAt { profile: IProfileContent, createdAt: number }
export interface IGenRes { result: IProfileWithCreatedAtWithHex, failed: string[] }
export interface IOnMetadataSubsEndHandler {
	(failed: string[], done: number): void
}
export interface IOnMetadataSubsProgressHandler {
	(failed: number, done: number): void
}

export class Nostr {
	#synced = false
	getToDo(filterFn?: (c: string) => boolean, rnd = false) {
		const x = uniq(this.#user.contacts.list)
			.filter(x =>
				isHex(x) &&
				!this.#profiles.has(x) &&
				!pool.metadataSubsState[x] &&
				(filterFn?.(x) ?? true)
			)
		return rnd ? shuffle(x) : x
	}
	get activSubs() { return pool.activSubs }
	get len() { return this.#profiles.size }
	get isRunning() { return this.activSubs || pool.isRunning }
	get isSync() { return this.#synced || this.#isSync() }
	get hex(): Readonly<string> { return this.#user.hex }
	get relays(): Readonly<{ read: string[], write: string[], createdAt: number }> { return this.#user.relays }
	get user(): Readonly<INostrDataUser> { return this.#user }
	public static cleanCache() { return new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24).clear() }
	public cleanCache() { return this.#ttlCache.clear() }
	public getProfile(hex: string): Readonly<IContact | undefined> {
		return this.#profiles.getProfile(hex)
	}
	public getProfiles(filterFn?: (c: IContact) => boolean): IContact[] {
		return this.#profiles.getProfiles(filterFn)
	}
	#ttlCache = new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24)
	#onProfileChanged?: IOnProfileChangedHandler
	#onContactsChanged?: IOnContactsChangedHandler
	#onUserMetadataChanged?: IOnUserMetadataChangedHandler
	#profiles = new ProfileData()
	#userRelays: string[] = []
	#user: INostrDataUser
	#tryMap = new Map<string, number>()
	constructor(
		userHex: string,
		{
			onProfileChanged,
			onContactsChanged,
			onUserMetadataChanged,
			userRelays
		}: {
			onProfileChanged?: IOnProfileChangedHandler,
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
		this.#userRelays = userRelays ?? []
		this.#onProfileChanged = onProfileChanged
		this.#onContactsChanged = onContactsChanged
		this.#onUserMetadataChanged = onUserMetadataChanged

		// void this.initUserData(userRelays)
	}
	#isSync() {
		if ((this.getToDo().length - [...this.#tryMap.values()].filter(x => x > 25).length) < 2) {
			// this.#synced = true
			return true
		}
		return false
	}
	#parseRelays(e: Event) {
		if (
			+e.kind === EventKind.Relays && e.created_at > this.#user.relays.createdAt
		) {
			this.#user.relays = e.tags.reduce<INostrDataUser['relays']>(
				(acc, cur) => {
					// do we need this ifs
					if (!isArr(acc?.read)) { acc.read = [] }
					if (!isArr(acc?.write)) { acc.write = [] }
					// eslint-disable-next-line prefer-const
					let [, relay, type] = cur
					relay = normalizeURL(relay)
					if (type === 'read' && !acc.read.includes(relay)) {
						acc.read.push(relay)
					} else if (type === 'write' && !acc.write.includes(relay)) {
						acc.write.push(relay)
					} else {
						if (!acc.read.includes(relay)) { acc.read.push(relay) }
						if (!acc.write.includes(relay)) { acc.write.push(relay) }
					}
					return acc
				},
				{ read: [], write: [], createdAt: e.created_at },
			)
		}
		this.#userRelays = this.#mergeRelays([])
		void this.#ttlCache.setObj('relays', this.#userRelays)
	}
	#mergeRelays(relays: string[]) {
		return uniq([
			'wss://purplepag.es',
			...this.#user.relays.read,
			...this.#user.relays.write,
			...this.#userRelays,
			...relays,
			...defaultRelays
		].map(normalizeURL))
	}
	#getProfilesFromCache(usersHexArr: string[]) {
		return this.#ttlCache.getObjsByKeys<IProfileWithCreatedAt>(usersHexArr)
	}
	async #loadProfilesFromCache(authors: string[] = []) {
		l('[#loadProfilesFromCache]', authors.length, 'authors')
		const profiles = await this.#getProfilesFromCache(authors)
		if (!profiles) { return }
		l('[#loadProfilesFromCache]', 'cache hit profiles', profiles?.length)
		this.#profiles.add(...profiles)
	}
	#getContactsFromCache() {
		return this.#ttlCache.getObj<{ list: string[], createdAt: number }>('contacts')
	}
	public async initUserData(userRelays?: string[]) {
		const cachedUser = await this.#ttlCache.get('userHex')
		l('[initUserData]', cachedUser, this.#user.hex, cachedUser !== this.#user.hex)
		if (cachedUser && cachedUser !== this.#user.hex) {
			await Promise.allSettled([
				this.#ttlCache.delete('contacts'),
				this.#ttlCache.delete('relays'),
				this.#ttlCache.set('userHex', this.#user.hex)
			])
		} else { void this.#ttlCache.set('userHex', this.#user.hex) }
		const cachedContacts = await this.#getContactsFromCache()
		if (cachedContacts?.list?.length) {
			l('[initUserData]', 'cache hit contacts', cachedContacts.list.length)
			this.#user.contacts = cachedContacts
			this.#onContactsChanged?.(this.#user.contacts.list.filter(x => x !== this.#user.hex))
		}
		const e = (await this.#getProfilesFromCache([this.#user.hex]))?.[0]?.value
		if (e?.profile) {
			l('[initUserData]', 'cache hit main user metadata in init')
			this.#profiles.add({ key: this.#user.hex, value: e })
			// this.#onProfileChanged?.([{ ...e.profile, hex: this.#user.hex }])
			this.#onUserMetadataChanged?.({ ...e.profile, hex: this.#user.hex })
		}
		const cachedRelays = await this.#ttlCache.getObj<string[]>('relays')
		if (cachedRelays) { this.#userRelays = this.#mergeRelays(cachedRelays) }
		let relays = this.#mergeRelays([])
		if (relays.length < 2) { relays = this.#mergeRelays(defaultRelays) }
		l('[initUserData]', !!cachedContacts, !!cachedUser)
		if (cachedContacts && cachedUser) {
			/* const profiles = await this.#ttlCache.getObjsByKeys<IProfileWithCreatedAt>(this.#user.contacts.list)
			l('[initUserData]', 'cache hit profiles', profiles?.length)
			if (!profiles?.length) { return }
			profiles.forEach(p => this.#profiles[p.key] = p.value)
			this.#onProfileChanged?.(Object.entries(this.#profiles).map(([k, v]) => ({ ...v.profile, hex: k }))) */
			return
		}
		const sub = pool.subscribePool({
			filter: {
				relayUrls: relays,
				authors: [this.#user.hex],
				kinds: [EventKind.Metadata, EventKind.ContactList, EventKind.Relays],
			}
		})
		let latestRelays = 0 // createdAt
		sub?.on('event', (e: Event) => {
			if (+e.kind === EventKind.Relays) { this.#parseRelays(e) }
			if (+e.kind === EventKind.Metadata) {
				this.#onMetadataEvent(e)
				this.#onUserMetadataChanged?.(ProfileData.eventToIContact(e))
			}
			if (+e.kind === EventKind.ContactList) {
				if (!userRelays && e.created_at > latestRelays) {
					// TODO user relays should be updated (every day?)
					const relays = this.#mergeRelays(parseUserRelays(e.content))
					latestRelays = e.created_at
					void store.setObj(STORE_KEYS.relays, relays)
					this.#userRelays = relays
					void this.#ttlCache.setObj('relays', relays)
				}
				l('event: ', filterFollows(e.tags).length)
				if (e.created_at > this.#user.contacts.createdAt) {
					this.#user.contacts.list = filterFollows(e.tags)
					this.#user.contacts.createdAt = e.created_at
					void this.#ttlCache.setObj('contacts', this.#user.contacts)
					this.#onContactsChanged?.(this.#user.contacts.list.filter(x => x !== this.#user.hex))
				}
			}
		})
		sub?.on('eose', () => { sub?.unsub?.() })
	}
	public search(q: string) {
		const sub = pool.subscribePool({
			filter: {
				relayUrls: ['wss://relay.nostr.band/all'],
				search: `${q} sort:popular sort:popular`,
				kinds: [EventKind.Metadata],
			}
		})
		sub?.on('event', (e: Event) => {
			l('search event', e)
		})
		return sub
	}

	public setupMetadataSubMany(opts: ISubOpts = {}) {
		l('[setupMetadataSubMany]'/* ,{opts} */)
		let { count = 0 }  = opts
		const { hasArr = [], toDo = [] } = opts
		if (count < 2) { count = 15 }
		let authors: string[] = []
		const old = hasArr?.map(x => x.hex) ?? []
		if (!toDo?.length) {
			authors = this.getToDo(x => !old.includes(x)).slice(0, count)
		} else {
			authors = this.getToDo(x => !old.includes(x) && toDo.includes(x)).slice(0, count)
		}
		authors = authors.filter(x => this.#checkReTry(x))
		if (authors.length < count) {
			authors = uniq(
				[
					...authors,
					...this.getToDo(x => !old.includes(x) && !authors.includes(x))
				]
			).slice(0, count)
		}
		if (authors.length < count) {
			l('[setupMetadataSubMany] no more to do', {
				internp: this.len,
				len: this.#user.contacts.list.length,
				authors: authors.length,
				old: old.length,
				isRunning: this.isRunning,
				toDo: toDo.length
			})
			return
		}
		l('[setupMetadataSubMany]', {
			internp: this.len,
			len: this.#user.contacts.list.length,
			authors: authors.length,
			old: old.length,
			isRunning: this.isRunning,
			toDo: toDo.length
		})
		return this.#setupMetadataSubMany(authors, opts)
	}
	#onMetadataEvent(e: Event) {
		if (+e.kind !== EventKind.Metadata || !this.#profiles.add(e)) { return }
		const p = this.#profiles.get(e.pubkey)
		if (!p) { return }
		void this.#ttlCache.setObj(e.pubkey, p)
		return this.#tryMap.delete(e.pubkey)
	}
	#addTry(hex: string) {
		const count = this.#tryMap.get(hex)
		if (!count) { return this.#tryMap.set(hex, 1) }
		this.#tryMap.set(hex, count + 1)
	}
	#checkReTry(hex: string) {
		const count = this.#tryMap.get(hex)
		return !count || count < 25
	}
	#setupMetadataSub(authors: string[], relays: string[] = [], opts: ISubOpts = {}) {
		authors.forEach(hex => this.#addTry(hex))
		const sub = pool.metadataSub({
			filter: {
				relayUrls: /* */ relays?.length ? relays : this.#mergeRelays([...relays ?? []]),
				authors,
			},
			args: opts
		})
		return sub
	}
	public setupMetadataSubAll(opts: ISubOpts = {}) {
		if (opts?.sig?.aborted) { return }
		// TODO: FIXME do more the 500 contacts
		return this.setupMetadataSubMany({ count: 500, ...opts })
	}
	async #setupMetadataSubMany(authors: string[], { sig, ...opts }: ISubOpts = {}) {
		if (!opts?.emitOnProfileChanged?.emitAsap && !opts?.emitOnProfileChanged?.emitOnEose) {
			if (!opts?.emitOnProfileChanged) { opts.emitOnProfileChanged = {} }
			opts.emitOnProfileChanged.emitOnEose = true
		}
		if (opts?.emitOnProfileChanged?.emitAsap && opts?.emitOnProfileChanged?.emitOnEose) {
			opts.emitOnProfileChanged.emitOnEose = false
		}
		try {
			const og = [...authors]
			if (sig?.aborted) { return }
			// l('[#setupMetadataSubMany]', authors.length, 'subs')
			if (!opts?.noCache) {
				await this.#loadProfilesFromCache(authors)
				const tmp = this.getProfiles(x => authors.includes(x.hex))
				l('[setupMetadataSub2] first hit', tmp.length, authors.length)
				if (tmp.length) {
					this.#onProfileChanged?.([...tmp])
				}
				// early return if all authors are cached
				if (tmp.length === authors.length) {
					return
				}
			}
			authors = authors.filter(x => isHex(x) && !this.#profiles.has(x))
			if (!authors?.length) { return }
			const all = uniq(authors)
			const allToDo = all.filter(x => !this.#profiles.has(x))
			l('start sub', allToDo.length)
			const sub = this.#setupMetadataSub(allToDo)
			if (opts?.emitOnProfileChanged?.emitAsap) {
				sub?.on('event', (e) => {
					this.#onMetadataEvent(e)
					this.#onProfileChanged?.([ProfileData.eventToIContact(e)])
				})
			} else {
				sub?.on('event', (e) => {
					this.#onMetadataEvent(e)
				})
			}
			if (opts?.emitOnProfileChanged?.emitOnEose) {
				sub?.on('eose', () => {
					this.#onProfileChanged?.(this.getProfiles(x => og.includes(x.hex)))
				})
			}
			if (opts?.onEose) {
				sub?.on('eose', async () => {
					const done = this.getProfiles(x => og.includes(x.hex)).map(x => x.hex)
					await opts?.onEose?.(done, og)
				})
			}
			return sub
			// eslint-disable-next-line no-console
		} catch (e) { console.error('subGen error', e) }
		// this.#onProfileChanged?.(this.getProfiles(x => authors.includes(x.hex)))
	}
}
interface ISubOpts extends SubscriptionOptions {
	contactsView?: { startIdx: number, endIdx: number }
	emitOnProfileChanged?: { emitAsap?: boolean, emitOnEose?: boolean },
	sig?: AbortSignal
	noCache?: boolean
	onEose?: (done: string[], authors: string[]) => void | Promise<void>
	hasArr?: IContact[]
	toDo?: string[]
	count?: number
}