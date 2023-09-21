import { l } from '@log'
import { isErr } from '@util'
import { type Filter, finishEvent, SimplePool, type Sub, validateEvent } from 'nostr-tools'

import { defaultRelays } from '../consts'

interface IPoolSubProps<K extends number = number> extends Filter<K> {
	relayUrls?: string[]
	skipVerification?: boolean
	authors?: string[]
	kinds?: K[]
}

interface IEventDM {
	kind: number
	tags: string[][]
	content: string
	created_at: number
}

class Relay {

	#pool?: SimplePool
	#sub? :Sub<number>
	#poolSubs = 0
	#poolEventsReceived: number = 0
	#relays:string[]=[]

	constructor() { }
	subscribePool({ relayUrls, authors, kinds, skipVerification,...conf }: IPoolSubProps) {
		try {
			if (!this.#pool) { this.#connectPool() }
			const relays = relayUrls?.length ? relayUrls : defaultRelays
			this.#relays=[...(this.#relays||[]),...(relayUrls||[]),...(defaultRelays||[])]
			const sub = this.#pool?.sub(
				relays,
				[{ authors, kinds,...conf }],
				{ skipVerification }
			)
			this.#sub = sub
			this.#poolSubs++
			l(`active subs: ${this.#poolSubs}`)
			sub?.on('eose', () => {
				this.#onPoolEose(relays)
			})
			sub?.on('event', _e => {
				this.#onEvent()
			})
			return sub
		} catch (e) {
			l(`RelayPool subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	async publishEventToPool(event: IEventDM, sk: string, relayUrls?: string[]) {
		const validated = this.#validate(event, sk)
		if (!validated) { return }
		try {
			this.#relays=[...(this.#relays||[]),...(relayUrls||[]),...(defaultRelays||[])]
			const res = await Promise.allSettled(this.#pool?.publish([...relayUrls || [], ...defaultRelays], validated)??[])
			l({ res })
			return true
		} catch (e) {
			l({ publishError: isErr(e) ? e.message : 'Publish error' })
			return false
		}
	}
	closePoolConnection(relayUrls: string[]) {
		this.#pool?.close([...(this.#relays||[]),...(relayUrls||[]),...(defaultRelays||[])])
	}

	#connectPool(opts:ConstructorParameters<typeof SimplePool>[0]={}) {
		if(this.#pool?.close){this.#pool.close([...(this.#relays||[]),...(defaultRelays||[])])}
		this.#pool = new SimplePool(opts)
	}

	#validate(event: IEventDM, sk: string) {
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

	#onPoolEose(relayUrls: string[]) {
		l('Unsubscribing pool: ', this.#sub)
		this.#sub?.unsub()
		this.#poolSubs--
		l(`pool events received: ${this.#poolEventsReceived}`)
		l(`active pool subs: ${this.#poolSubs}`)
		this.closePoolConnection(relayUrls)
	}

}

export const relay = new Relay()