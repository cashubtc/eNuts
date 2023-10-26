import { l } from '@log'
import { IContact } from '@model/nostr'
import { isArrOf, isObj } from '@util'
import { type Event } from 'nostr-tools'

import { parseProfileContent } from '../util'
import { IProfileWithCreatedAt, IProfileWithCreatedAtWithHex } from './Nostr'

function isEvent(v: unknown): v is Event {
	return isObj(v) && 'sig' in v && 'kind' in v
		&& 'id' in v && 'content' in v
		&& 'pubkey' in v 
}
const isEventArr = isArrOf(isEvent)
/* const isProfileWithCreatedAt = isArrOf(
	(v): v is IProfileWithCreatedAt =>
		isObj(v) && 'profile' in v && 'createdAt' in v && !('hex' in v) 
)*/
const isProfileWithCreatedAtWithHex = isArrOf(
	(v): v is IProfileWithCreatedAtWithHex =>
		isObj(v) && 'profile' in v && 'hex' in v && 'createdAt' in v
)
const isKvProfileArr = isArrOf(
	(v): v is { key: string, value: IProfileWithCreatedAt } =>
		isObj(v) && 'key' in v && 'value' in v &&
		isObj(v.value) && 'profile' in v.value && 'createdAt' in v.value && !('hex' in v.value)
)
export class ProfileData {
	public static eventToIContact(e: Event): IContact {
		return { hex: e.pubkey, ...parseProfileContent(e) }
	}
	public static eventToIProfileWithCreatedAt(e: Event): IProfileWithCreatedAt {
		return { createdAt: e.created_at, profile: parseProfileContent(e) }
	}
	public static eventToIProfileWithCreatedAtWithHex(e: Event): IProfileWithCreatedAtWithHex {
		return { createdAt: e.created_at, profile: parseProfileContent(e), hex: e.pubkey }
	}
	#data
	public get size() { return this.#data.size }
	constructor() { this.#data = new Map<string, IProfileWithCreatedAt>() }
	#toContacts() {
		try {
			// l(this.#data.size,this.#data)
			const iter = this.#data.entries()
			const result: IContact[] = new Array<IContact>(this.#data.size)
			let i = 0
			let tmp = iter.next()
			while (!tmp?.done) {
				const [k, v] = tmp.value
				// l('toIC0', { k, v })
				result[i++] = { ...v.profile, hex: k }
				tmp = iter.next()
			}
			return result.sort((a, b) => a.hex.localeCompare(b.hex))
			/* return [...this.#data.entries()]
				.map(([k, v]) => ({ ...v.profile, hex: k }))
				.sort((a, b) => a.hex.localeCompare(b.hex)) */
		} catch (e) {
			l({ e }, this.#data.entries())
		}
	}
	public getProfile(hex: string): Readonly<IContact | undefined> {
		const r = this.#data.get(hex)
		if (!r) { return }
		return { ...r.profile, hex }
	}
	public getProfiles(filterFn?: (c: IContact) => boolean): IContact[] {
		return this.#toContacts()?.filter(filterFn ?? (() => true)) ?? []
	}
	public add(...events: Event<number>[]): number;
	public add(...profiles: IProfileWithCreatedAtWithHex[]): number;
	public add(...profiles: { key: string; value: IProfileWithCreatedAt; }[]): number
	public add(...arr:
		(Event<number>
			| { key: string, value: IProfileWithCreatedAt }
			| IProfileWithCreatedAtWithHex
		)[]
	): number {
		// l('add', { arr })
		let count = 0
		if (isEventArr(arr)) {
			for (const e of arr) {
				if (!e?.pubkey || !e?.content || !e?.created_at) { continue }
				const p = this.#data.get(e.pubkey)
				if (p && e.created_at <= p.createdAt) { continue }
				count++
				this.#data.set(e.pubkey, { profile: parseProfileContent(e), createdAt: e.created_at })
			}
			return count
		}
		if (isProfileWithCreatedAtWithHex(arr)) {
			for (const e of arr) {
				const p = this.#data.get(e.hex)
				if (p?.createdAt && p.createdAt > e.createdAt) { continue }
				const hex = e.hex
				delete (e as Partial<IProfileWithCreatedAtWithHex>).hex
				count++
				this.#data.set(hex, e)
			}
			return count
		}
		if (isKvProfileArr(arr)) {
			// l('add is key value arr')
			for (const { key, value } of arr) {
				const p = this.#data.get(key)
				if (p?.createdAt && p.createdAt > value.createdAt) { continue }
				// l({ key, value })
				count++
				this.#data.set(key, value)
			}
		}
		return count
	}
	public has(hex: string) { return this.#data.has(hex) }
	public get(hex: string) { return this.#data.get(hex) }
}
