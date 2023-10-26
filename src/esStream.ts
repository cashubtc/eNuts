/* eslint-disable no-console */
type Action = 'user_infos' | 'user_profile'
type TCond<T extends Action> = T extends 'user_infos'
	? { pubkeys: string[] }
	: T extends 'user_profile'
	? { pubkey: string }
	: never
type Base<T extends Action, T2 = TCond<T>> = [T, T2]
type Ev<T extends Action> = ['REQ', string, { cache: Base<T> }]

class CachedRelay {
	#url = 'wss://cache2.primal.net/v1'
	#ws: WebSocket
	static #getBaseReqEvent<T extends Action>(
		x: Base<T>,
		id = Math.random().toString().slice(2)
	): Ev<T> {
		return ['REQ', id, { cache: x }]
	}
	/* 
		getStatus returns the connection state
		Value 	State 		Description
		0 		CONNECTING 	Socket has been created. The connection is not yet open.
		1 		OPEN	 	The connection is open and ready to communicate.
		2 		CLOSING 	The connection is in the process of closing.
		3 		CLOSED 		The connection is closed or couldn't be opened. 
	*/
	get status(): 0 | 1 | 2 | 3 { return this.#ws?.readyState as 0 | 1 | 2 | 3 ?? 3 }
	constructor() {
		this.#ws = new WebSocket('wss://cache2.primal.net/v1')
		this.#init()
	}
	#init() {
		this.#ws = new WebSocket('wss://cache2.primal.net/v1')
		if (!this.#ws) { return }
		this.#ws.onopen = () => { console.log(`[onOpen][${this.#ws.url}]`) }
		this.#ws.onmessage = msg => {
			console.log(`[onMsg][${this.#ws.url}]`, msg.data)
			// TODO handle data event
		}

		this.#ws.onerror = e => { console.log(`[onError][${this.#ws.url}]`, e) }

		this.#ws.onclose = () => { console.log(`[onClose][${this.#ws.url}]`) }
	}
	#send<T extends Action>(msg: Ev<T>) {
		if (this.status !== 2) { this.#init() }
		console.log(JSON.stringify(msg))

		this.#ws.send(JSON.stringify(msg))
	}
	static getUserInfos(hexKeys: string[]) {
		return CachedRelay.#getBaseReqEvent(['user_infos', { pubkeys: hexKeys }])
	}
	static getUserProfile(hex: string) {
		return CachedRelay.#getBaseReqEvent(['user_profile', { pubkey: hex }])
	}
	getUserInfos(hexKeys: string[]) {
		return this.#send(CachedRelay.#getBaseReqEvent(['user_infos', { pubkeys: hexKeys }]))
	}
	getUserProfile(hex: string) {
		return this.#send(CachedRelay.#getBaseReqEvent(['user_profile', { pubkey: hex }]))
	}
	getProfile(hex: string) {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket('wss://cache2.primal.net/v1')
			const handel = setTimeout(() => {
				console.log('timeout')
				ws.close()
				clearTimeout(handel)
				reject(new Error('timeout'))
			}, 1000)
			ws.addEventListener('open', () => {
				console.log('start')
				ws.send(JSON.stringify(CachedRelay.getUserProfile(hex)))
			})
			ws.addEventListener('message', (e) => {
				clearTimeout(handel)
				ws.close()
				resolve(e.data)
			})
			ws.addEventListener('error', (e) => {
				clearTimeout(handel)
				console.log(e)
				ws.close()
				reject(e)
			})
		})
	}
}

// export const relay = new CachedRelay()
// ["REQ","48989526636563463",{"cache":["user_infos",{"pubkeys":["d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d"]}]}]
CachedRelay.getUserInfos(['d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d'])
// ["REQ","14132991357268",{"cache":["user_profile",{"pubkey":"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d"}]}]
console.log(JSON.stringify(CachedRelay.getUserProfile('d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d')))


/* const ws = new WebSocket('wss://cache2.primal.net/v1')
ws.onopen = () => { console.log(`[onOpen][${ws.url}]`) }

ws.onmessage = msg => { console.log(`[onMsg][${ws.url}]`, msg.data) }

ws.onerror = e => { console.log(`[onError][${ws.url}]`, e) }

ws.onclose = () => { console.log(`[onClose][${ws.url}]`) } */

/* function getBaseReqEvent<T extends Action>(
	x: Base<T>,
	id = Math.random().toString().slice(2)
) {
	return ['REQ', id, { cache: x }]
}
export function getUserInfos(hexKeys: string[]) {
	return getBaseReqEvent(['user_infos', { pubkeys: hexKeys }])
}

export function getUserProfile(hex: string) {
	return getBaseReqEvent(['user_profile', { pubkey: hex }])
} */
/*
	['REQ', ID, {'cache': ['user_infos', {'pubkeys': ['64-hex digits of pubkey id']}]}]
	['REQ', ID, {'cache': ['user_profile', {'pubkey': '64-hex digits of pubkey id'}]}]


	['REQ', ID, {'cache': ['net_stats']}]
	['REQ', ID, {'cache': ['feed', {'pubkey': '64-hex digits of pubkey id'}]}]
	['REQ', ID, {'cache': ['thread_view', {'event_id': '64-hex digits of event id'}]}]
	['REQ', ID, {'cache': ['events', {'event_ids': ['64-hex digits of event id']}]}]
*/


/*
- Connection log will appear here
- Connecting to: wss://cache2.primal.net/v1
- Connection Established
▲ ["REQ","48989526636563463",{"cache":["user_infos",{"pubkeys":["d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d"]}]}]
▼ ["EVENT","48989526636563463",{"id":"485a5f3603d54dae24dba4da8e0074aaf081459d5dca4d645fa481aa84bee9ea","pubkey":"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d","created_at":1695298777,"kind":0,"tags":[],"content":"{\"banner\":\"https://pbs.twimg.com/profile_banners/1527647747536461832/1687382177/1500x500\",\"website\":\"https://www.btcprague.com/\",\"nip05\":\"btcprague@btcprague.com\",\"picture\":\"https://pbs.twimg.com/profile_images/1676983239888588801/-OSqlrx1_400x400.jpg\",\"lud16\":\"btcprague@getalby.com\",\"nip05valid\":true,\"display_name\":\"BTCPrague\",\"about\":\"🎙️The biggest #bitcoin event in Europe\\n📅  June 13 - 15, 2024 in Prague, Czech Republic\\n#conference #expo #community #networking\\ninfo & TICKETS 👉 btcprague.com\",\"name\":\"btcprague\"}","sig":"889c4f998ad721b01a57b972ad5709b3a0b79e466740f145034a78a672b7e2053fc5cb1d6dc93b651868b9a9eee01b549aae4c2a4553b099e3e9e1bfb6f514c1"}]
▼ ["EVENT","48989526636563463",{"kind":10000108,"content":"{\"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d\":5409}"}]
▼ ["EVENT","48989526636563463",{"kind":10000133,"content":"{\"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d\":5409}"}]
▼ ["EVENT","48989526636563463",{"kind":10000119,"content":"{\"event_id\":\"485a5f3603d54dae24dba4da8e0074aaf081459d5dca4d645fa481aa84bee9ea\",\"resources\":[{\"url\":\"https://pbs.twimg.com/profile_images/1676983239888588801/-OSqlrx1_400x400.jpg\",\"variants\":[{\"s\":\"m\",\"a\":1,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=m&a=1&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"o\",\"a\":1,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"s\",\"a\":1,\"w\":200,\"h\":200,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=s&a=1&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"l\",\"a\":0,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=l&a=0&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"o\",\"a\":0,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=o&a=0&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"m\",\"a\":0,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=m&a=0&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"l\",\"a\":1,\"w\":400,\"h\":400,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=l&a=1&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"},{\"s\":\"s\",\"a\":0,\"w\":200,\"h\":200,\"mt\":\"image/jpeg\",\"media_url\":\"https://primal.b-cdn.net/media-cache?s=s&a=0&u=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1676983239888588801%2F-OSqlrx1_400x400.jpg\"}],\"mt\":\"image/jpeg\"}]}"}]
▼ ["EOSE","48989526636563463"]
▲ ["REQ","14132991357268",{"cache":["user_profile",{"pubkey":"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d"}]}]
▼ ["EVENT","14132991357268",{"id":"485a5f3603d54dae24dba4da8e0074aaf081459d5dca4d645fa481aa84bee9ea","pubkey":"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d","created_at":1695298777,"kind":0,"tags":[],"content":"{\"banner\":\"https://pbs.twimg.com/profile_banners/1527647747536461832/1687382177/1500x500\",\"website\":\"https://www.btcprague.com/\",\"nip05\":\"btcprague@btcprague.com\",\"picture\":\"https://pbs.twimg.com/profile_images/1676983239888588801/-OSqlrx1_400x400.jpg\",\"lud16\":\"btcprague@getalby.com\",\"nip05valid\":true,\"display_name\":\"BTCPrague\",\"about\":\"🎙️The biggest #bitcoin event in Europe\\n📅  June 13 - 15, 2024 in Prague, Czech Republic\\n#conference #expo #community #networking\\ninfo & TICKETS 👉 btcprague.com\",\"name\":\"btcprague\"}","sig":"889c4f998ad721b01a57b972ad5709b3a0b79e466740f145034a78a672b7e2053fc5cb1d6dc93b651868b9a9eee01b549aae4c2a4553b099e3e9e1bfb6f514c1"}]
▼ ["EVENT","14132991357268",{"kind":10000105,"content":"{\"pubkey\":\"d7a7476b1253a1902f765685ffe3d351f8c2e2ac728f655aeb53f4c9a2f9a77d\",\"follows_count\":194,\"followers_count\":5409,\"note_count\":203,\"reply_count\":30,\"time_joined\":1677158719}"}]
▼ ["EOSE","14132991357268"]
*/