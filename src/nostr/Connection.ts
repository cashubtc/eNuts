import { l } from '@log'
import { isErr } from '@util'
import { SimplePool, Sub } from 'nostr-tools'

import { defaultRelays } from './consts'

class RelayPool {

	pool: SimplePool
	sub?: Sub<number>
	activeSubs: number
	eventsReceived: number

	constructor() {
		this.pool = new SimplePool()
		this.activeSubs = 0
		this.eventsReceived = 0
	}

	subscribe(userRelays: string[], authors: string[]) {
		try {
			this.sub = this.pool.sub(
				userRelays.length ? userRelays : defaultRelays,
				[{ authors }]
			)
			this.activeSubs++
			l(`active subs: ${this.activeSubs}`)
			this.sub.on('eose', () => {
				this.#onEose()
			})
			this.sub.on('event', (_e) => {
				// l('event: ', e)
				this.#onEvent()
			})
		} catch (e) {
			l(`Relay subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	#onEvent() {
		this.eventsReceived++
		l(`events received: ${this.eventsReceived}`)
	}

	#onEose() {
		l('Unsubscribing: ', this.sub)
		this.sub?.unsub()
		this.activeSubs--
		l(`active subs: ${this.activeSubs}`)
	}
}

export const relayPool = new RelayPool()