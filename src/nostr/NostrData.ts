import Config from '@src/config'
import { l } from '@src/logger'
import { IContact, type IProfileContent } from '@src/model/nostr'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { TTLCache } from '@src/storage/store/ttl'
import { isArr, uniq } from '@src/util'
import { type Event as NostrEvent} from 'nostr-tools'

import { LL } from './class/LL'
import { IOnMetadataSubsProgressHandler, MetadataRelay } from './class/MetadataRelay'
import { pool } from './class/Pool'
import { defaultRelays, EventKind } from './consts'
import { filterFollows, isHex, parseProfileContent, parseUserRelays } from './util'

class EventQueue<T extends number = number> {
	static toIContact(event: NostrEvent<number>): IProfileWithCreatedAtWithHex {
		return {
			profile: parseProfileContent(event),
			createdAt: event.created_at,
			hex: event.pubkey
		}
	}
	eventQueue = new LL<NostrEvent<T>>()
	public push(e: NostrEvent<T>) { return this.eventQueue.push(e) }
	public shift() { return this.eventQueue.shift() }

	public *shiftRead() {
		while (this.eventQueue.size) {
			const e = this.shift()
			if (!e?.pubkey) { return }
			yield {
				profile: parseProfileContent(e),
				createdAt: e.created_at,
				hex: e.pubkey
			}
		}
	}
	/* *[Symbol.iterator]() {

	} */
}

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
export class NostrData {
	getToDo(filterFn?: (c: string) => boolean, rnd = false) {
		const x = uniq(this.#user.contacts.list)
			.filter(x => isHex(x) && !this.#profiles[x]?.profile && (filterFn?.(x) ?? true))
		return rnd ? shuffle(x) : x
	}
	get activSubs() { return MetadataRelay.activSubs + pool.activSubs }
	get len() { return Object.keys(this.#profiles).length }
	get isRunning() {
		return this.activSubs||pool.isRunning || !!this.#relay.isRunning || MetadataRelay.isAnyInstanceRunning()
	}
	get isSync() { return this.getToDo().length<2 }
	get hex(): Readonly<string> { return this.#user.hex }
	get relays(): Readonly<{ read: string[], write: string[], createdAt: number }> { return this.#user.relays }
	get user(): Readonly<INostrDataUser> { return this.#user }
	public static cleanCache() { return new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24).clear() }
	public cleanCache() { return this.#ttlCache.clear() }
	public getOneProfile(hex: string): Readonly<IContact | undefined> { return { ...this.#profiles[hex]?.profile, hex } }
	public getProfiles(filterFn?: (c: IContact) => boolean): IContact[] {
		return this.#toContacts().filter(filterFn ?? (() => true))
	}

	static #q = new EventQueue()
	#ttlCache = new TTLCache('__ttlCacheProfiles__', 1000 * 60 * 60 * 24)
	#onProfileChanged?: IOnProfileChangedHandler
	#onContactsChanged?: IOnContactsChangedHandler
	#onUserMetadataChanged?: IOnUserMetadataChangedHandler
	#profiles: { [k: string]: IProfileWithCreatedAt } = {}
	#userRelays: string[] = []
	#user: INostrDataUser
	#relay = MetadataRelay.init()
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
		this.#userRelays = this.#userRelays ?? []
		this.#onProfileChanged = onProfileChanged
		this.#onContactsChanged = onContactsChanged
		this.#onUserMetadataChanged = onUserMetadataChanged
		this.#relay = MetadataRelay.init()
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
			...relays
		])
	}
	#getProfilesFromCache(usersHexArr: string[]) {
		return this.#ttlCache.getObjsByKeys<IProfileWithCreatedAt>(usersHexArr)
	}
	async #loadProfilesFromCache(authors: string[] = []) {
		l('[#loadProfilesFromCache]', authors.length, 'authors')
		const profiles = await this.#getProfilesFromCache(authors)
		if (!profiles) { return }
		l('[#loadProfilesFromCache]', 'cache hit profiles', profiles?.length)
		for (const { key, value } of profiles) {
			if (
				this.#profiles?.[key]?.createdAt &&
				this.#profiles[key].createdAt > value.createdAt
			) { continue }
			this.#profiles[key] = value
		}
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
		const e = await this.#ttlCache.getObj<IProfileWithCreatedAt>(this.#user.hex)
		if (e?.profile) {
			l('[initUserData]', 'cache hit main user metadata in init')
			this.#profiles[this.#user.hex] = e
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
				skipVerification: Config.skipVerification,
			}
		})
		let latestRelays = 0 // createdAt
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.Relays) { this.#parseRelays(e) }
			if (+e.kind === EventKind.Metadata) {
				void this.#onMetadataEvent(e, { emitOnUserMetadataChanged: true })
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
				if (e.created_at > this.#user.contacts.createdAt) {
					this.#user.contacts.list = filterFollows(e.tags)
					this.#user.contacts.createdAt = e.created_at
					void this.#ttlCache.setObj('contacts', this.#user.contacts)
					this.#onContactsChanged?.(this.#user.contacts.list.filter(x => x !== this.#user.hex))
				}
			}
		})
	}
	public setupMetadataSub(hex: string, opts: { emitOnProfileChanged?: boolean, emitOnUserMetadataChanged?: boolean } = {}) {
		if (!hex || !isHex(hex) || this.#profiles[hex]?.profile) { return }
		return this.#setupMetadataSubMany([hex], {
			emitOnProfileChanged: true,
			emitOnUserMetadataChanged: true,
			...opts
		})
	}
	public setupMetadataSubMany(arr: IContact[], count = 20, opts: { emitOnProfileChanged?: boolean, emitOnUserMetadataChanged?: boolean } = {}) {
		// if (this.isRunning) { return }
		let authors: string[] = []
		const old = arr?.map(x => x.hex) ?? []
		const filtered = this.getToDo(x => !old.includes(x))
		authors = filtered.slice(0, count)
		l('[setupMetadataSubMany]', { internp: this.len, f: filtered.length, len: this.#user.contacts.list.length, authors: authors.length, old: old.length, isRunning: this.isRunning, arr: arr.length })
		return this.#setupMetadataSubMany(authors, {
			/* emitOnProfileChanged: true,
			emitOnUserMetadataChanged: true,
			...opts */
		})
	}
	async #onMetadataEvent(e: NostrEvent, { emitOnProfileChanged }: {
		emitOnProfileChanged?: boolean,
		emitOnUserMetadataChanged?: boolean
	}) {
		if (+e.kind !== EventKind.Metadata) { return }
		const p = this.#profiles[e.pubkey]
		if (p && e.created_at <= p.createdAt) { return }
		this.#profiles[e.pubkey] = {
			profile: parseProfileContent(e),
			createdAt: e.created_at,
		}
		if (emitOnProfileChanged) {
			this.#onProfileChanged?.([{ ...this.#profiles[e.pubkey].profile, hex: e.pubkey }])
		}
		await this.#ttlCache.setObj(e.pubkey, this.#profiles[e.pubkey])
	}
	async #setupMetadataSub(authors: string[] = [], opts: { emitOnProfileChanged?: boolean, emitOnUserMetadataChanged?: boolean } = {}) {
		const onRet = () => {
			if (opts?.emitOnProfileChanged) {
				this.#onProfileChanged?.(this.getProfiles(x =>
					authors?.includes?.(x.hex)
				))
			}
			if (opts?.emitOnUserMetadataChanged) {
				this.#onUserMetadataChanged?.({ ...this.#profiles[this.#user.hex].profile, hex: this.#user.hex })
			}
		}
		authors = authors.filter(x => isHex(x) && !this.#profiles[x]?.profile)
		if (!authors?.length) {
			onRet()
			return
		}
		l(authors.length, 'subs')
		await this.#loadProfilesFromCache(authors)
		authors = authors.filter(x => isHex(x) && !this.#profiles[x]?.profile)
		if (!authors?.length) {
			onRet()
			return
		}
		l('cache miss', authors?.length)
		const sub = pool.metadataSub({
			filter: {
				relayUrls: this.#mergeRelays([]),
				authors: authors,
				skipVerification: Config.skipVerification,
			}
		})
		sub?.on('event', (e) => NostrData.#q.push(e)/* this.#onMetadataEvent(e, opts) */)
	}
	public setupMetadataSubAll(
		cb?: IOnMetadataSubsProgressHandler,
		sig?: AbortSignal
	) {
		if (sig?.aborted) { return }
		return this.#setupMetadataSubMany(this.#user.contacts.list, {}, cb, sig)
	}
	async #setupMetadataSubMany(
		authors: string[],
		opts: {
			emitOnProfileChanged?: boolean | undefined
			emitOnUserMetadataChanged?: boolean | undefined
		} = {},
		cb?: IOnMetadataSubsProgressHandler,
		sig?: AbortSignal
	) {
		// if (!sig) { sig = AbortSignal.timeout(5000) }
		const og = [...authors]
		if (sig?.aborted) { return }
		// l('[#setupMetadataSubMany]', authors.length, 'subs')
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
		authors = authors.filter(x => isHex(x) && !this.#profiles[x]?.profile)
		if (!authors?.length) { return }
		const all = uniq(authors)
		const allToDo = all.filter(x => !this.#profiles[x]?.profile)
		// await this.#setupMetadataSub(allToDo, opts)
		// l('allTodo has own user hex in it: ', allToDo.includes(this.#user.hex))
		// l('[#setupMetadataSubMany]', 'cache miss, fetch contacts, contacts length: ', allToDo?.length)

		// const done = all.filter(x => !this.#profiles[x]?.profile).length
		try {
			// const failed: string[] = []
			// const result: IProfileWithCreatedAt[] = []
			const subGen = await Promise.allSettled([
				/* (() => {
					const r = MetadataRelay.init('wss://cache2.primal.net/v1')
					const sub = r.relay.sub([{
						cache: ['user_infos', { pubkeys: allToDo }]
					} as Filter], { skipVerification: true }
					)
					sub.on('event', (e) => NostrData.#q.push(e))
					sub.on('eose', () => { sub.unsub() })
				})(), */
				// 
				// (async () => {
				// 	const r = MetadataRelay.init('wss://n0p0.shroomslab.net')
				// 	const sub = await r._sub({ authors: allToDo })
				// 	if (!sub) { return }
				// 	sub.on('event', (e) => NostrData.#q.push(e))
				// 	sub.on('eose', () => { sub.unsub() })
				// })()
				// ,
				(async () => {
					const r = MetadataRelay.init('wss://relayable.org')
					const sub = await r._sub({ authors: allToDo })
					if (!sub) { return }
					sub.on('event', (e) => NostrData.#q.push(e))
					sub.on('eose', () => { sub.unsub() })
				})()
				,
				// this.#setupMetadataSub(allToDo, {}),
				this.#relay._sub({
					authors: allToDo,
					// eslint-disable-next-line @typescript-eslint/no-misused-promises
					// onSubsEnd: async (_failed: string[], done: number) => {
					// 	l('onSubsEnd', _failed.length, done)
					// 	failed.push(..._failed)
					// 	const failedToDo = uniq(failed).filter(x => !this.#profiles[x])
					// 	if (failedToDo.length) { await this.#setupMetadataSub(failedToDo, opts) }
					// },
					onMetadataEvent: e => NostrData.#q.push(e),
					// onProgress: (failed: number, done: number) => { l('onProgress', failed, done) },
					opts: {}
				})
			])
			if (!subGen) { return }
			// subGen.on('eose',()=>l('eose##################'))
			// subGen.on('event',(e)=>l('e##################',e))
			l({ subGen, status: this.#relay.isReady })

			// for (const it of NostrData.#q) {

			// }
			if (sig?.aborted) { return }
			for (const e of NostrData.#q.shiftRead()) {
				if (sig?.aborted) { return }
				// l({ item: e, failed })
				const p = this.#profiles[e.hex]
				if (p && e.createdAt <= p.createdAt) { continue }
				this.#profiles[e.hex] = {
					profile: e.profile,
					createdAt: e.createdAt,
				}
				this.#onProfileChanged?.([{ ...this.#profiles[e.hex].profile, hex: e.hex }])
				// result.push(this.#profiles[e.pubkey])
				/*if (opts?.emitOnProfileChanged) {
					
				}  */
				// void this.#ttlCache.setObj(e.hex, this.#profiles[e.hex])
			}
			if (sig?.aborted) { return }
			const failedToDo = allToDo.filter(x => !this.#profiles[x])
			if (failedToDo.length) { await this.#setupMetadataSub(failedToDo, opts) }
			/* for await (const { result: { hex, profile, createdAt }, failed } of subGen) {
				if (sig?.aborted) { return }
				l('profile for hex: ', hex, { profile })
				// this.#profiles[hex] = { profile, createdAt }
				// done = all.filter(x => !this.#profiles[x]?.profile).length
				
				/* if (cb) { cb(failed.length, done) } 
			} */
			/* 	l('failed allTodo: ', allToDo)
		
				l('unmoon') */
			// if (sig?.aborted) { return}
		} catch (e) {
			l('subGen error', e)
		}
		this.#onProfileChanged?.(this.getProfiles(x => og.includes(x.hex)))
		// if (this.#relay.failedState) { return this.#setupMetadataSubMany(authors,opts,c,sig)}
	}
	// async * #getProfiles(
	// 	authors: string[],
	// 	cb?: IOnMetadataSubsProgressHandler,
	// 	sig?: AbortSignal
	// ) {
	// 	if (sig?.aborted) { return [] }
	// 	const _ogAuthors = authors.filter(x => isHex(x))
	// 	const yielded: string[] = []
	// 	authors = _ogAuthors
	// 	await this.#loadProfilesFromCache(authors)
	// 	authors = authors.filter(x => isHex(x) && !this.#profiles[x]?.profile)
	// 	if (!authors?.length) {
	// 		for (const p of this.getProfiles(x =>
	// 			!yielded.includes(x.hex) && _ogAuthors?.includes?.(x.hex))
	// 		) {
	// 			if (sig?.aborted) { return }
	// 			if (yielded.includes(p.hex)) { continue }
	// 			yield p
	// 			yielded.push(p.hex)
	// 		}
	// 		return
	// 	}
	// 	l('[##getProfiles]', 'cache miss', authors?.length)
	// 	const relay = this.#metadataRelay
	// 	const all = uniq(authors)
	// 	const allToDo = all.filter(x => !this.#profiles[x]?.profile)
	// 	// const done = all.filter(x => !this.#profiles[x]?.profile).length
	// 	l('####')
	// 	let done = false
	// 	await this.#relay_sub({
	// 		authors: allToDo,
	// 		onSubsEnd: (failed: string[], done: number) => {
	// 			l('onSubsEnd', failed.length, done)
	// 			const failedToDo = failed.filter(x => !this.#profiles[x])
	// 			if (failedToDo.length) { void this.#setupMetadataSub(failedToDo) }
	// 		},
	// 		onMetadataEvent: (e: NostrEvent) => this.#onMetadataEvent(e),
	// 		onProgress: (failed: number, done: number) => { l('onProgress', failed, done) },
	// 		opts: {}
	// 	}
	// 	)
	// 	do {
	// 		for (const p of this.getProfiles(x =>
	// 			!yielded.includes(x.hex) && _ogAuthors?.includes?.(x.hex))
	// 		) {
	// 			if (sig?.aborted) { return }
	// 			if (yielded.includes(p.hex)) { continue }
	// 			yield p
	// 			yielded.push(p.hex)
	// 		}
	// 		if (yielded.length >= _ogAuthors.length) { break }
	// 	} while (!done)
	// }
	#toContacts() {
		return Object.entries(this.#profiles)
			.map(([k, v]) => ({ ...v.profile, hex: k }))
			.sort((a, b) => a.hex.localeCompare(b.hex))
	}
}
export interface IProfileWithCreatedAtWithHex extends IProfileWithCreatedAt {
	hex: string
}
export interface IProfileWithCreatedAt { profile: IProfileContent, createdAt: number }
export interface IGenRes { result: IProfileWithCreatedAtWithHex, failed: string[] }

function shuffle<T>(a: T[]) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}