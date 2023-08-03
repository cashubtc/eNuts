import { l } from '@log'
import { isErr } from '@util'
import { finishEvent, type Relay as NostrRelay, relayInit, SimplePool, type Sub, validateEvent } from 'nostr-tools'

import { defaultRelays } from '../consts'

// TODO use better typing for this 2 similar interfaces
interface ISingleSubProps {
	relayUrl?: string
	skipVerification?: boolean
	authors: string[]
	kinds?: number[]
}

interface IPoolSubProps {
	relayUrls?: string[]
	skipVerification?: boolean
	authors: string[]
	kinds?: number[]
}

interface IEventDM {
	kind: number
	tags: string[][]
	content: string
	created_at: number
}

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
			await this.#connectSingle(relayUrl)
			// create subscription
			const sub = this.#singleRelay?.sub([{ authors, kinds }], { skipVerification })
			sub?.on('eose', () => {
				sub.unsub()
				this.#singleSubs--
				this.#closeConnection()
			})
			return sub

		} catch (e) {
			l(`single Relay subscribe error: ${isErr(e) ? e.message : 'No error message'}`)
		}
	}

	subscribePool({ relayUrls, authors, kinds, skipVerification }: IPoolSubProps) {
		try {
			this.#pool
			const sub = this.#pool.sub(
				relayUrls?.length ? relayUrls : defaultRelays,
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

	async publishEventToSingleRelay(event: IEventDM, sk: string, relayUrl?: string) {
		const validated = this.#validate(event, sk)
		if (!validated) { return }
		try {
			await this.#connectSingle(relayUrl)
			await this.#singleRelay?.publish(validated)
			this.#closeConnection()
			return true
		} catch (e) {
			l({ publishError: isErr(e) ? e.message : 'Publish error' })
			return false
		}
	}

	async publishEventToPool(event: IEventDM, sk: string, relayUrls?: string[]) {
		const validated = this.#validate(event, sk)
		if (!validated) { return }
		try {
			// eslint-disable-next-line @typescript-eslint/await-thenable
			const res = await this.#pool.publish([...relayUrls || [], ...defaultRelays], validated)
			l({ res })
			return true
		} catch (e) {
			l({ publishError: isErr(e) ? e.message : 'Publish error' })
			return false
		}
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

	async #connectSingle(relayUrl?: string) {
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
	}

	#closeConnection() {
		this.#singleRelay?.close()
		this.#singleConnections--
		l(`closed connection to ${this.#singleRelay?.url} - remaining connections: ${this.#singleConnections}`)
		this.#singleRelay = undefined
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