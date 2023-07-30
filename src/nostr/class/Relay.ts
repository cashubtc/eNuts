import { l } from '@log'
import { isErr } from '@util'
import { type Relay as NostrRelay, relayInit, SimplePool, type Sub } from 'nostr-tools'

import { defaultRelays } from '../consts'

interface ISingleSubProps {
	relayUrl?: string,
	skipVerification?: boolean
	authors: string[],
	kinds: number[]
}

/*
SubscriptionOptions = {
    id?: string;
    verb?: 'REQ' | 'COUNT';
    skipVerification?: boolean;
    alreadyHaveEvent?: null | ((id: string, relay: string) => boolean);
};
*/

// dummy relay class
class Relay {

	#pool: SimplePool
	#sub?: Sub<number>
	#poolSubs: number
	#poolEventsReceived: number
	#singleRelay?: NostrRelay
	// #singleRelayUrl?: string
	#singleSubs: number
	#singleConnections: number

	constructor() {
		this.#pool = new SimplePool()
		this.#poolSubs = 0
		this.#poolEventsReceived = 0
		this.#singleSubs = 0
		this.#singleConnections = 0
	}

	async subscribeSingle({ relayUrl, authors, kinds, skipVerification }: ISingleSubProps) {
		try {
			// connect only if no connections available
			if (!this.#singleRelay) {
				this.#singleRelay = relayInit(relayUrl || defaultRelays[0])
				await this.#singleRelay.connect()
				this.#singleRelay.on('connect', () => {
					this.#singleConnections++
					l(`connected to ${this.#singleRelay?.url} - total connections: ${this.#singleConnections}`)
				})
				this.#singleRelay.on('error', () => {
					l(`failed to connect to ${this.#singleRelay?.url}`)
					this.#singleRelay = undefined
				})
			}
			// create subscription
			const sub = this.#singleRelay.sub([{ authors, kinds }], { skipVerification })
			sub.on('eose', () => {
				sub.unsub()
				this.#singleSubs--
				this.#singleRelay?.close()
				this.#singleConnections--
				l(`closed connection to ${this.#singleRelay?.url} - remaining connections: ${this.#singleConnections}`)
				this.#singleRelay = undefined
			})
			return sub

		} catch (e) {
			l(`single Relay subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	subscribePool(userRelays: string[], authors: string[], kinds: number[], skipVerification?: boolean) {
		try {
			const sub = this.#pool.sub(
				userRelays.length ? userRelays : defaultRelays,
				[{ authors, kinds }],
				{ skipVerification }
			)
			this.#sub = sub
			this.#poolSubs++
			l(`active subs: ${this.#poolSubs}`)
			sub.on('eose', () => {
				this.#onPoolEose()
			})
			sub.on('event', _e => {
				this.#onEvent()
			})
			return sub
		} catch (e) {
			l(`RelayPool subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	#onEvent() {
		this.#poolEventsReceived++
	}

	#onPoolEose() {
		l('Unsubscribing pool: ', this.#sub)
		this.#sub?.unsub()
		this.#poolSubs--
		l(`pool events received: ${this.#poolEventsReceived}`)
		l(`active pool subs: ${this.#poolSubs}`)
	}
}

export const relay = new Relay()