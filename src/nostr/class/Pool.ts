import { l } from '@log'
import { INostrSendData } from '@model/nav'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { updateNostrDmUsers } from '@store/nostrDms'
import { cTo } from '@store/utils'
import { isErr, uniq } from '@util'
import type { EventTemplate, Filter, Sub, SubscriptionOptions } from 'nostr-tools'
import { finishEvent, SimplePool, validateEvent } from 'nostr-tools'

import { defaultRelays, enutsPubkey, EventKind } from '../consts'
import { encrypt } from '../crypto'
import { hasRelayValidPrefix, normalizeURL, parseUserRelays } from '../util'

interface IPoolSubArgs {
	filter: IPoolSubProps,
	args?: SubscriptionOptions
}
interface IPoolSubProps<K extends number = number> extends Filter<K> {
	relayUrls?: string[]
	skipVerification?: boolean
	authors?: string[]
	kinds?: K[]
}
interface IPublishEventProps {
	nostr: INostrSendData
	amount: number
	token: string
}

class Pool {
	get isRunning() { return !!this.activSubs }
	get activSubs() { return this.#subs.size }
	#ids = new Set<string>()
	#metadataSubs: { [k: string]: 0 | 1 | 2 } = {}
	get metadataSubsState(): Readonly<{ [k: string]: 0 | 1 | 2 }> { return this.#metadataSubs }
	#pool?: SimplePool
	#subs: Set<Sub<number>> = new Set()
	#poolEventsReceived = 0
	#relays = defaultRelays
	#opts: ConstructorParameters<typeof SimplePool>[0] = {
		eoseSubTimeout: 3400,
		getTimeout: 3400,
		seenOnEnabled: false, // options.seenOnEnabled !== false
		batchInterval: 100
	}
	constructor(opts: ConstructorParameters<typeof SimplePool>[0] = {}) {
		this.#opts = { ...this.#opts, ...opts }
	}
	#relaysClean(relayUrls?: string[]) {
		const relays = uniq(relayUrls?.length ? relayUrls : this.#relays).map(normalizeURL)
		this.#relays = uniq([
			...(this.#relays || []),
			...(relayUrls || []),
			...(defaultRelays || [])
		])
			.map(normalizeURL)
		return relays
	}
	#sub({ args, filter: { relayUrls, authors, kinds, skipVerification, ...conf } }: IPoolSubArgs) {
		try {
			if (!this.#pool) { this.#connectPool() }
			if (!this.#pool) { return }
			const relays = this.#relaysClean(relayUrls)
			const sub = this.#pool.sub(
				relays,
				[{ authors, kinds, ...conf }],
				{
					eoseSubTimeout: 3000 * 1,
					// alreadyHaveEvent: (id, _relay) => this.#ids.has(id),
					...args ?? {},
					skipVerification,
				}
			)
			let eoseHandlers: (() => (void | Promise<void>))[] = []
			const _sub: Sub = {
				...sub,
				on: (e, f) => {
					if (e === 'eose') {
						const fn = f as (() => (void | Promise<void>))
						eoseHandlers.push(fn)
					}
					sub?.on(e, f)
				}
			}
			const handel = setTimeout(() => {
				this.#onPoolEose(sub, relays)
				sub?.unsub?.()
				_sub?.unsub?.()
				clearTimeout(handel)
				eoseHandlers.forEach(fn => { void fn() })
				eoseHandlers = []
				l('###############################\n\n\nsub timeout\n\n\n#####################################')
			}, 3000)
			sub?.on('event', e => {
				clearTimeout(handel)
				this.#ids.add(e.id)
				this.#onEvent()
			})
			sub?.on('eose', () => {
				clearTimeout(handel)
				this.#onPoolEose(sub, relays)
			})
			this.#subs.add(sub)
			return sub
		} catch (e) {
			l(`RelayPool subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}
	subscribePool(conf: IPoolSubArgs) {
		try {
			const sub = this.#sub(conf)
			return sub
		} catch (e) {
			l(`RelayPool subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}
	metadataSub({ args, filter: { relayUrls, authors, ...conf } }: IPoolSubArgs) {
		l('[metadataSub]', authors?.length)
		try {
			if (!authors?.length) { return }
			const hexArr: string[] = []
			for (const hex of authors) {
				if (this.#metadataSubs[hex]) { continue }
				this.#metadataSubs[hex] = 1
				hexArr.push(hex)
			}
			l({ hexArr: hexArr.length })
			if (!hexArr?.length) { return }
			const sub = this.#sub(
				{
					filter: {
						relayUrls,
						authors: hexArr,
						kinds: [EventKind.Metadata],
						...conf
					},
					args
				}
			)
			if (!sub) {
				return l('[metadataSub] sub is null')
			}
			// this.#subs.add(sub)
			sub?.on('eose', () => {
				for (const h of hexArr) {
					// this.#metadataSubs[h] = 0
					delete this.#metadataSubs[h]
				}
			})
			sub?.on('event', e => {
				this.#metadataSubs[e.pubkey] = 2
			})
			return sub
		} catch (e) {
			l(`RelayPool subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}
	#publishEventToPool(event: EventTemplate<4>, sk: string, relayUrls?: string[]) {
		const validated = this.#validate(event, sk)
		if (!validated) { return false }
		try {
			const relays = this.#relaysClean(relayUrls)
			void this.#pool?.publish(relays, validated)
			return true
		} catch (e) {
			l({ publishError: isErr(e) ? e.message : 'Publish error' })
			return false
		}
	}
	async publishEvent({ nostr, amount, token }: IPublishEventProps) {
		const sk = await secureStore.get(SECRET)
		const userNostrNpub = await store.get(STORE_KEYS.npub)
		if (!sk?.length || !nostr?.contact) { return false }
		const msg = `${userNostrNpub || nostr.senderName}  (sender not verified) just sent you ${amount} Sat in Ecash using ${enutsPubkey}!\n\n ${token}`
		const cipherTxt = encrypt(sk, nostr.contact.hex, msg)
		const event = {
			kind: EventKind.DirectMessage,
			tags: [['p', nostr.contact.hex]],
			content: cipherTxt,
			created_at: Math.ceil(Date.now() / 1000),
		}
		const storedRelays = await store.get(STORE_KEYS.relays)
		const userRelays = cTo<string[]>(storedRelays || '[]')
		const relaysToPublish = [...userRelays, ...defaultRelays]
		const recipientRelays = await this.#getRelaysByHex(nostr.contact.hex, relaysToPublish)
		const allRelays = [...recipientRelays, ...relaysToPublish].filter(hasRelayValidPrefix)
		const published = this.#publishEventToPool(event, sk, allRelays)
		if (!published) { return false }
		// save recipient hex to get the conversation later on
		await updateNostrDmUsers(nostr.contact)
		return true
	}
	async #getRelaysByHex(hex: string, relays: string[]) {
		if (!this.#pool) { this.#connectPool() }
		const resp = await this.#pool?.get(
			relays,
			{
				authors: [hex],
				kinds: [EventKind.ContactList],
				limit: 1,
			}
		)
		if (!resp) { return [] }
		return parseUserRelays(resp?.content)
	}
	closePoolConnection(relayUrls: string[]) {
		this.#subs.forEach(x => x?.unsub())
		this.#pool?.close(this.#relaysClean(relayUrls))
	}
	#connectPool(opts: ConstructorParameters<typeof SimplePool>[0] = {}) {
		if (this.#pool?.close) { this.#pool.close(this.#relaysClean([...(this.#relays || []), ...(defaultRelays || [])])) }
		this.#pool = new SimplePool({ ...this.#opts, ...opts })
	}
	#validate(event: EventTemplate<4>, sk: string) {
		const finished = finishEvent(event, sk)
		const isValid = validateEvent(finished)
		if (!isValid) {
			l('Event invalid!')
			return null
		}
		return finished
	}
	#onEvent() {
		this.#poolEventsReceived++
	}
	#onPoolEose(sub: Sub<number>, _relayUrls: string[] = []) {
		sub?.unsub?.()
		this.#subs.delete(sub)
		l(`pool events received: ${this.#poolEventsReceived}`)
		l(`active pool subs: ${this.#subs.size}`)
		// this.closePoolConnection(relayUrls)
	}
}
export const pool = new Pool()