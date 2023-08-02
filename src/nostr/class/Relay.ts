import { l } from '@log'
import { isErr } from '@util'
import { type Relay as NostrRelay, relayInit, SimplePool, type Sub } from 'nostr-tools'

import { defaultRelays } from '../consts'

// TODO use better typing for this 2 similar interfaces
interface ISingleSubProps {
	relayUrl?: string,
	skipVerification?: boolean
	authors: string[],
	kinds?: number[]
}

interface IPoolSubProps {
	relayUrls?: string[],
	skipVerification?: boolean
	authors: string[],
	kinds?: number[]
}

interface IEventDM {
    kind: number;
    pubkey: string | null | undefined;
    tags: string[][];
    content: string;
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

	subscribePool({ relayUrls, authors, kinds, skipVerification }: IPoolSubProps) {
		try {
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

	async publishEvent(event: IEventDM) {
		l('publish event first log: ', { event })
		const relay = defaultRelays[0]
		const data = JSON.stringify(['EVENT', event])
		await this.#publish(data, relay)
	}

	// async * publishEvent(event: string, relays: string[]) {
	// 	l('publish event first log: ', {event})
	// 	const arr = uniq([...relays, ...defaultRelays])
	// 	l({ arr })
	// 	const data = JSON.stringify(['EVENT', JSON.parse(event)])
	// 	for (const item of arr) {
	// 		l('this.#publish!')
	// 		// eslint-disable-next-line no-await-in-loop
	// 		yield await this.#publish(data, item)
	// 	}
	// }

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

	#publish(event: string, url: string) {
		return new Promise<{ ok: boolean, reason: string, relay: string }>(resolve => {
			let ws: WebSocket
			try {
				ws = new WebSocket(url)
				l({ ws })
				url = url.replace('wss://', '').replace('ws://', '')
				ws.onerror = () => {
					l('ws.onerror')
					resolve({ relay: url, ok: false, reason: 'err' })
					end()
				}
				ws.onopen = () => {
					l('ws.onopen')
					ws.send(event)
				}
				ws.onmessage = msg => {
					l('onmessage: ', { msg })
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
					const data = JSON.parse(msg.data)
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const ok: boolean = data[2]
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const reason: string = data[3] || ''
					resolve({ relay: url, ok, reason })
					end()
				}
				setTimeout(() => {
					l('timeout')
					end()
					resolve({ relay: url, ok: false, reason: 'timeout' })
				}, 1000)
			} catch (e) {
				l('catch block')
				if (isErr(e)) {
					resolve({ relay: url, ok: false, reason: e.message })
					end()
					return
				}
				end()
				resolve({ relay: url, ok: false, reason: 'err' })
			}
			function end() {
				try { ws?.close(1000, 'not needed anymore, thanks') } catch (_) {/* ignore */ }
			}
		})
	}
}

export const relay = new Relay()