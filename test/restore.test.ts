import type { MintKeys, Proof } from '@cashu/cashu-ts'
import { RESTORE_INTERVAL, RESTORE_OVERSHOOT } from '@consts/mints'
import { ICounters } from '@src/model'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { cTo, toJson } from '@store/utils'

type TRestoreInterval = { proofs: Proof[]; newKeys?: MintKeys; lastCount: number } | undefined


describe('test restore', () => {
	// eslint-disable-next-line @typescript-eslint/await-thenable
	afterAll(async () => { await store.delete(STORE_KEYS.restoreCounter) })

	const mints = [
		{ mintUrl: 'mint1-2Ids', id: 'mint1-id1' },
	]

	// an array of responses from wallet.restore
	const resp = [
		{
			proofs: [
				{
					amount: 3,
					secret: '3',
					C: '3',
					id: mints[0].id
				},
				{
					amount: 1,
					secret: '1',
					C: '1',
					id: mints[0].id
				}
			],
			newKeys: undefined
		},
		{
			proofs: [
				{
					amount: 3,
					secret: '33',
					C: '33',
					id: mints[0].id
				},
				{
					amount: 1,
					secret: '11',
					C: '11',
					id: mints[0].id
				}
			],
			newKeys: undefined
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [],
			newKeys: undefined,
		}
	]

	const resp2 = [
		{
			proofs: [
				{
					amount: 3,
					secret: '3',
					C: '3',
					id: mints[0].id
				},
				{
					amount: 1,
					secret: '1',
					C: '1',
					id: mints[0].id
				}
			],
			newKeys: undefined
		},
		{
			proofS: [],
			newKeys: undefined
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [
				{
					amount: 3,
					secret: '33',
					C: '33',
					id: mints[0].id
				},
				{
					amount: 1,
					secret: '11',
					C: '11',
					id: mints[0].id
				}
			],
			newKeys: undefined
		},
		{
			proofs: [
				{
					amount: 3,
					secret: '33',
					C: '33',
					id: mints[0].id
				},
				{
					amount: 1,
					secret: '11',
					C: '11',
					id: mints[0].id
				}
			],
			newKeys: undefined
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [],
			newKeys: undefined,
		},
		{
			proofs: [],
			newKeys: undefined,
		}
	]

	const restoreInterval = (
		from: number,
		to: number,
		restoredProofs: Proof[] = [],
		overshoot: number = 0,
		cycle: number = 0,
		withGap?: boolean
	): TRestoreInterval => {
		try {
			const { proofs, newKeys } = withGap ? resp2[cycle] : resp[cycle]
			cycle++
			from += RESTORE_INTERVAL
			to += RESTORE_INTERVAL
			if (proofs?.length) {
				restoredProofs.push(...proofs)
				overshoot = 0
				return restoreInterval(from, to, restoredProofs, overshoot, cycle, withGap)
			}
			if (overshoot < RESTORE_OVERSHOOT) {
				overshoot++
				return restoreInterval(from, to, restoredProofs, overshoot, cycle, withGap)
			}
			return { proofs: restoredProofs, newKeys, lastCount: to }
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log('[restoreInterval] error', { e })
		}
	}

	test('creates and returns new counter', async () => {
		let counters = await store.get(STORE_KEYS.restoreCounter)
		if (!counters) {
			await store.set(STORE_KEYS.restoreCounter, toJson({ [mints[0].id]: 0 }))
			counters = await store.get(STORE_KEYS.restoreCounter)
		}
		const parsedCounters = cTo<ICounters>(counters || '')
		expect(parsedCounters[mints[0].id]).toBe(0)
	})

	test('increments counter', async () => {
		const count = 5
		const counters = await store.get(STORE_KEYS.restoreCounter)
		const parsedCounters = cTo<ICounters>(counters || '')
		const keysetId = mints[0].id
		parsedCounters[keysetId] = (parsedCounters[keysetId] || 0) + count
		await store.set(STORE_KEYS.restoreCounter, toJson(parsedCounters))
		expect(parsedCounters[keysetId]).toBe(5)
	})

	test('restore', () => {
		const resp = restoreInterval(0, RESTORE_INTERVAL, [], 0, 0)
		expect(resp?.proofs.length).toBe(4)
		expect(resp?.lastCount).toBe(300)
	})

	test('restore with gaps (mints responds with empty proofs for 2 cycles)', () => {
		const resp = restoreInterval(0, RESTORE_INTERVAL, [], 0, 0, true)
		expect(resp?.proofs.length).toBe(6)
		expect(resp?.lastCount).toBe(450)
	})
})