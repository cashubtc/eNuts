import { l } from '@log'
import Config from '@src/config'
import { arrToChunks, sleep } from '@util'
import { type Event, relayInit, type Sub,type SubscriptionOptions } from 'nostr-tools'

import { IGenRes, IProfileWithCreatedAtWithHex } from '../NostrData'
import { isHex, parseProfileContent } from '../util'
import { LL } from './LL'

interface I {
	authors: string[],
	opts?: SubscriptionOptions,
	onSubsEnd?: IOnMetadataSubsEndHandler,
	onProgress?: IOnMetadataSubsProgressHandler,
	onMetadataEvent?: (e: Event) => void
}
export interface IOnMetadataSubsEndHandler {
	(failed: string[], done: number): void
}
export interface IOnMetadataSubsProgressHandler {
	(failed: number, done: number): void
}
/*
	Value 	State 	        Description
	0 	    CONNECTING 	    Socket has been created. The connection is not yet open.
	1 	    OPEN 	        The connection is open and ready to communicate.
	2 	    CLOSING 	    The connection is in the process of closing.
	3 	    CLOSED      	The connection is closed or couldn't be opened.
*/
export class MetadataRelay {
	static instances: { [k: string]: MetadataRelay } = {}
	static isAnyInstanceRunning() {
		return Object.values(MetadataRelay.instances)
			.some(x => !!x.isRunning)
	}
	static get activSubs(){
		return Object.values(MetadataRelay.instances)
			.reduce((acc, cur) => {
				acc += cur.#subs.size
				return acc
			}, 0)
	}
	static init(url = 'wss://purplepag.es') {
		if (!this.instances[url]) { this.instances[url] = new MetadataRelay(url) }
		void this.instances[url].setUp().catch(l)
		return this.instances[url]
	}
	failedState = false
	#reconnectCount = 0
	private constructor(url?: string) { if (url) { this.#url = url } }
	#gotConnectEvent = false
	get #isConnected() { return this.isReady && this.#gotConnectEvent }
	get isReady() {
		// l({ status: this.#relay?.status, e: this.#gotConnectEvent })
		const flag = this.relay?.status === 1
		if (!flag && this.#gotConnectEvent) { this.#gotConnectEvent = false }
		return flag
	}
	get isRunning() {
		return this.#isConnected && this.#subs.size
	}
	get metadataSubsState(): Readonly<{ [k: string]: 0 | 1 | 2 }> { return this.#metadataSubs }
	static get eventIds(): Readonly<Set<string>> { return this.#ids }
	async #initRelay(options?: {
		getTimeout?: number
		listTimeout?: number
		countTimeout?: number
	}) {
		// l('isConn', this.#isConnected)
		if (this.#isConnected) { return }
		try {
			this.relay = relayInit(this.#url, options)
			this.relay.on('auth', () => l(`[#initRelay][onAuth][${this.#url}]`))
			this.relay.on('connect', () => {
				l(`[#initRelay][onConnect][${this.#url}]`)
				this.#gotConnectEvent = true
			})
			this.relay.on('disconnect', async () => {
				l(`[#initRelay][onDisconnect][${this.#url}]`)
				this.#reconnectCount++
				this.#gotConnectEvent = false
				if (this.#reconnectCount > 10) {
					this.failedState = true
					return
				}
				await sleep(this.#reconnectCount * 100)
				l('reconnect', this.#url, this.#reconnectCount)
				return this.#initRelay(options)
			})
			this.relay.on('error', () => l(`[#initRelay][[onError][${this.#url}]`))
			this.relay.on('notice', (e) => l(`[#initRelay][onNotice][${this.#url}]`, e))
			await this.relay.connect()
			l('init done')
		} catch (e) { l(`[#initRelay][Error][${this.#url}]`, e) }
	}
	// constructor() { this.#relay = relayInit(this.#url) }
	#url = 'wss://purplepag.es'
	relay = relayInit(this.#url)
	#subs = new Set<Sub<number>>()
	static #ids = new Set<string>()
	#metadataSubs: { [k: string]: 0 | 1 | 2 } = {}
	#poolEventsReceived = 0
	#wait(limit = 9) {
		l('[StartWait]', this.#subs.size)
		return new Promise((resolve, _reject) => {
			let handel: NodeJS.Timeout
			const cb = () => {
				clearTimeout(handel)
				if (this.#subs.size > limit) {
					handel = setTimeout(cb, 100)
					return
				}
				l('[EndWait]', this.#subs.size)
				resolve(true)
			}
			handel = setTimeout(cb, 100)
			cb()
		})
	}
	#cleanAuthors(authors: string[]) {
		const hexArr: string[] = []
		for (const hex of authors) {
			if (!isHex(hex) || this.#metadataSubs[hex]) { continue }
			hexArr.push(hex)
		}
		return hexArr
	}
	async setUp() {
		if (this.#isConnected) { return }
		await this.#initRelay()
		if (!this.#isConnected) {
			await this.#initRelay()
		}
		if (!this.#isConnected) {
			await this.#initRelay()
			this.#close()
		}

	}
	async #sub(authors: string[], opts: SubscriptionOptions = {}) {
		await this.setUp()
		if (!this.#isConnected) { return }
		authors = this.#cleanAuthors(authors)
		const sub = this.relay.sub([{ authors, kinds: [0/* Kind.Metadata */] }], {
			// eoseSubTimeout: 1000 * 10,
			alreadyHaveEvent: (id, _relay) => MetadataRelay.#ids.has(id),
			skipVerification: Config.skipVerification,
			// ...opts
		})
		this.#onMetadataSubStart(sub, authors)
		l('this.#subs.size', this.#subs.size)
		sub?.on('eose', () => {
			this.#onMetadataEose(sub, authors)
			l(`pool events received: ${this.#poolEventsReceived}`)
			l(`active pool subs: ${this.#subs.size}`)
		})
		// tell class that we have a new event for metadata belonging to this hex
		sub?.on('event', e => {
			this.#onEvent(e)
			this.#metadataSubs[e.pubkey] = 2
		})
		return sub
	}
	async sub(authors: string[], opts: SubscriptionOptions = {}, onSubsEnd?: IOnMetadataSubsEndHandler, onProgress?: IOnMetadataSubsProgressHandler) {
		if (!this.#isConnected) {
			await this.#initRelay()
		}
		if (!authors?.length) { return }
		l({ authors: authors.length })
		// eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
		return new Promise<{ result: IProfileWithCreatedAtWithHex[], failed: string[] }>(async (resolve, reject) => {
			const result: IProfileWithCreatedAtWithHex[] = []
			const failed: string[] = []
			try {
				let i = 0
				for (const arr of arrToChunks(authors, 500)) {
					// eslint-disable-next-line no-await-in-loop
					const sub = await this.#sub(arr, { ...opts })
					if (!sub) { continue }
					sub?.on('eose', ((authors: string[]) =>
						() => {
							for (const hex of authors) {
								if (this.#metadataSubs[hex] === 2) {
									delete this.#metadataSubs[hex]
									continue
								}
								failed.push(hex)
								delete this.#metadataSubs[hex]
							}
							l('eose', this.#subs.size)
							if (this.#subs.size === 0) {
								l('done')
								// this.#close()
								// TODO
								onSubsEnd?.(failed, i)
								resolve({ result, failed })
							}
						})(arr))
					sub.on('event', e => {
						i++
						onProgress?.(failed.length, i)
						result.push({
							profile: parseProfileContent(e),
							createdAt: e.created_at,
							hex: e.pubkey
						})
					})
					// eslint-disable-next-line no-await-in-loop
					await this.#wait()
				}
			} catch (e) {
				l('RelayPool subscribe error:', e)
				reject(e)
			}
		})
	}

	async _sub({
		authors,
		opts = {},
		onSubsEnd,
		onProgress,
		onMetadataEvent
	}: I
	) {
		await this.setUp()
		if (!this.#isConnected) { return }
		authors = this.#cleanAuthors(authors)
		if (!authors?.length) { return onSubsEnd?.(authors, 0) }
		const failed: string[] = []
		try {
			let i = 0
			await this.#wait()
			const sub = await this.#sub(authors, { ...opts })
			if (!sub) { return onSubsEnd?.(authors, i) }
			sub?.on('eose', () => {
				l('eose', this.#subs.size)
				onSubsEnd?.(failed, i)
				for (const hex of authors) {
					if (this.#metadataSubs[hex] === 2) {
						delete this.#metadataSubs[hex]
						continue
					}
					failed.push(hex)
					delete this.#metadataSubs[hex]
				}
			})
			sub.on('event', e => {
				onMetadataEvent?.(e)
				i++
				onProgress?.(failed.length, i)
			})
			return sub
		} catch (e) { l('RelayPool subscribe error:', e) }
	}
	async * subGen(
		authors: string[],
		opts: SubscriptionOptions = {},
		onSubsEnd?: IOnMetadataSubsEndHandler,
		onProgress?: IOnMetadataSubsProgressHandler,
		onMetadataEvent?: (e: Event) => void
	): AsyncGenerator<IGenRes, Error, unknown> {
		if (!this.#isConnected) {
			await this.#initRelay()
			if (!this.#isConnected) {
				l('can´t connect to relay')
				return new Error('can´t connect to relay')
			}
		}
		// authors = this.#cleanAuthors(authors)


		if (!authors?.length) { return new Error('0 len arr') }

		let nextResolve: ((x: IGenRes) => void) | undefined
		// linked list class
		const eventQueue = new LL<IProfileWithCreatedAtWithHex>()

		function pushToQueue(event: Event<0>) {
			/* if (!event?.created_at || !event?.content || !event?.pubkey) {
				return
			} */
			const e = {
				profile: parseProfileContent(event),
				createdAt: event.created_at,
				hex: event.pubkey
			}
			if (!nextResolve) { return eventQueue.push(e) }
			nextResolve({ result: e, failed })
			nextResolve = undefined
		}
		const failed: string[] = []
		let flag = false
		try {
			let i = 0
			for (const arr of arrToChunks(authors, 500)) { // [[20 strings], [], []] - [[20 strings]]
				l('start subscription for authors', arr.length)
				const handel = setTimeout(() => {
					clearTimeout(handel)
					flag = true
				}, 1000 * 3)

				// eslint-disable-next-line no-await-in-loop
				await this.#wait()
				// eslint-disable-next-line no-await-in-loop
				const sub = await this.#sub(arr, { ...opts }) // internal use of sub to save current sub states
				if (!sub) {
					// if sub is undefined, we will never get metadata because only 1 relay is available
					failed.push(...arr)
					l('sub is undefined')
					continue
				}

				sub?.on('eose', ((authors: string[]) =>
					() => {
						if (handel) { clearTimeout(handel) }
						for (const hex of authors) {
							if (this.#metadataSubs[hex] === 2) {
								delete this.#metadataSubs[hex]
								continue
							}
							failed.push(hex)
							delete this.#metadataSubs[hex]
						}
						l('eose', this.#subs.size)
						if (this.#subs.size === 0) {
							l('done')
							// this.#close()
							onSubsEnd?.(failed, i)
						}
					})(arr))

				sub.on('event', e => {
					if (handel) { clearTimeout(handel) }
					l('event in arrToChumks loop: ', e.pubkey)
					pushToQueue(e)
					i++
					onProgress?.(failed.length, i)
					onMetadataEvent?.(e)
				})
				// eslint-disable-next-line no-await-in-loop
				await this.#wait()
			}

			try {
				while (this.#subs.size > 0 || eventQueue.size > 0) {
					if (flag) { break }
					l('eventQueue.size: ', eventQueue.size, 'this.#subs.size: ', this.#subs.size)
					if (eventQueue.size > 0) {
						yield ({ result: eventQueue.shift()!, failed })
						continue
					}
					// eslint-disable-next-line no-await-in-loop
					const event = await new Promise<IGenRes>(resolve => { nextResolve = resolve })
					yield event
				}
			} catch (e) { l('loop', e) }
		} catch (e) { l('RelayPool subscribe error:', e) }
		return new Error('RelayPool subscribe error')
	}

	#onSubStart(sub: Sub<number>) { this.#subs.add(sub) }
	#onMetadataSubStart(sub: Sub<number>, authors: string[]) {
		this.#onSubStart(sub)
		for (const hex of authors) { this.#metadataSubs[hex] = 1 }
	}
	#onEvent(e: Event<number>) {
		MetadataRelay.#ids.add(e.id)
		this.#poolEventsReceived++
	}
	#onMetadataEose(sub: Sub<number>, _authors: string[]) {
		this.#onPoolEose(sub)
		// for (const h of authors) {
		// 	delete this.#metadataSubs[h]
		// }
	}
	#onPoolEose(sub: Sub<number>, _relayUrls: string[] = []) {
		sub?.unsub?.()
		this.#subs.delete(sub)
		l(`MetadataRelay events received: ${this.#poolEventsReceived}`)
		l(`active MetadataRelay subs: ${this.#subs.size}`)
		// this.closePoolConnection(relayUrls)
	}
	#close() {
		this.#subs.forEach(x => x?.unsub?.())
		this.#gotConnectEvent = false
		this.#subs?.clear?.()
		// this.#ids?.clear?.()
		this.#metadataSubs = {}
		this.relay?.close?.()
	}
	public async __test(authors: string[], opts: SubscriptionOptions = {}) {
		if (!this.#isConnected) {
			await this.#initRelay({ listTimeout: 1000 * 10 })
			if (!this.#isConnected) { return }
		}
		authors = this.#cleanAuthors(authors)
		const arr = await this.relay.list([{ authors, kinds: [0/* Kind.Metadata */] }], {
			eoseSubTimeout: 1000 * 10,
			alreadyHaveEvent: (id, _relay) => MetadataRelay.#ids.has(id),
			skipVerification: Config.skipVerification,
			...opts
		})
		return { arr, failed: authors.every(x => arr.find(y => x === y.pubkey)) }
	}
}
// void (async () => {
// 	try {
// 		const metadataRelay = new MetadataRelay()
// 		/* metadataRelay?.sub(o).then(x => x?.on('event', log))*/
// 		let count = 0
// 		const iter = metadataRelay?.subGen(o)
// 		if (iter) {
// 			for await (const iterator of iter) {
// 				count++
// 				l({ iterator }, count)
// 			}
// 			l('done')
// 		}
// 	} catch (e) { l(e) }

// })()
