import { l } from '@log'
import { isErr } from '@util'
import type { EventTemplate, Filter, Sub, SubscriptionOptions } from 'nostr-tools'
import { finishEvent, SimplePool, validateEvent } from 'nostr-tools'

import { defaultRelays, EventKind } from '../consts'

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

class Pool {
	get isRunning() { return !!this.activSubs }
	get activSubs(){return this.#subs.size}
	#ids = new Set<string>()
	#metadataSubs: { [k: string]: 0 | 1 | 2 } = {}
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
	#sub({ args, filter: { relayUrls, authors, kinds, skipVerification, ...conf } }: IPoolSubArgs) {
		try {
			if (!this.#pool) { this.#connectPool() }
			if (!this.#pool) { return }
			const relays = relayUrls?.length ? relayUrls : defaultRelays
			this.#relays = [...(this.#relays || []), ...(relayUrls || []), ...(defaultRelays || [])]

			// fetch the author details with batchedList method with key 'authors'
			/* const author = this.#pool.batchedList('authors', relays, [{
				kinds: [0],
				limit: 1,
				authors,
			}]); */

			const sub = this.#pool.sub(
				relays,
				[{ authors, kinds, ...conf }],
				{
					// alreadyHaveEvent: (id, _relay) => this.#ids.has(id),
					...args ?? {},
					skipVerification,
				}
			)
			sub?.on('event', e => {
				this.#ids.add(e.id)
				this.#onEvent()
			})
			sub?.on('eose', () => this.#onPoolEose(sub, relays))
			this.#subs.add(sub)
			l(`active subs: ${this.#subs.size}`)
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
	metadataSub({ args, filter: { relayUrls, authors, skipVerification, ...conf } }: IPoolSubArgs) {
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
					args: {
						eoseSubTimeout: 1000 * 3,
						alreadyHaveEvent: (id, _relay) => this.#ids.has(id),
						...args ?? {},
						skipVerification,
					},
				}
			)
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
	async publishEventToPool(event: EventTemplate<4>, sk: string, relayUrls?: string[]) {
		const validated = this.#validate(event, sk)
		if (!validated) { return }
		try {
			this.#relays = [...(this.#relays || []), ...(relayUrls || []), ...(defaultRelays || [])]
			const res = await Promise.allSettled(this.#pool?.publish([...relayUrls || [], ...defaultRelays], validated) ?? [])
			l({ res })
			return true
		} catch (e) {
			l({ publishError: isErr(e) ? e.message : 'Publish error' })
			return false
		}
	}
	closePoolConnection(relayUrls: string[]) {
		this.#subs.forEach(x => x?.unsub())
		this.#pool?.close([...(this.#relays || []), ...(relayUrls || []), ...(defaultRelays || [])])
	}
	#connectPool(opts: ConstructorParameters<typeof SimplePool>[0] = {}) {
		if (this.#pool?.close) { this.#pool.close([...(this.#relays || []), ...(defaultRelays || [])]) }
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