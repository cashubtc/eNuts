import { l } from '@log'
import { isErr } from '@util'
import { relayInit, SimplePool, type Sub } from 'nostr-tools'

import { defaultRelays } from '../consts'

interface ISingleSubProps {
	relayUrl?: string,
	skipVerification?: boolean
	authors: string[],
}

class Relay {

	#pool: SimplePool
	#sub?: Sub<number>
	#poolSubs: number
	#singleSubs: number
	#poolEventsReceived: number
	#singleConnections: number

	constructor() {
		this.#pool = new SimplePool()
		this.#poolSubs = 0
		this.#poolEventsReceived = 0
		this.#singleSubs = 0
		this.#singleConnections = 0
	}

	// this does not block app interaction
	async subscribeSingle({ relayUrl, skipVerification, authors }: ISingleSubProps) {
		try {
			const relay = relayInit(relayUrl || defaultRelays[0])
			await relay.connect()
			relay.on('connect', () => {
				this.#singleConnections++
				l(`connected to ${relay.url} - total connections: ${this.#singleConnections}`)
			})
			relay.on('error', () => {
				l(`failed to connect to ${relay.url}`)
			})
			const sub = relay.sub([{ authors }], { skipVerification })
			sub.on('eose', () => {
				sub.unsub()
				this.#singleSubs--
				relay.close()
				this.#singleConnections--
				l(`closed connection to ${relay.url} - remaining connections: ${this.#singleConnections}`)
			})
			return sub

		} catch (e) {
			l(`single Relay subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	// this blocks app interaction until eose event...
	subscribePool(userRelays: string[], authors: string[]) {
		try {
			const sub = this.#pool.sub(
				userRelays.length ? userRelays : defaultRelays,
				[{ authors }]
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