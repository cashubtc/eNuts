import type { IHistoryEntry } from '@model'
import { historyStore } from '@store/HistoryStore'



describe('test HistoryStore', () => {
	// eslint-disable-next-line @typescript-eslint/await-thenable
	afterAll(async () => { await store.close() })
	const store = historyStore
	const entry: IHistoryEntry = {
		amount: 1,
		type: 1, // LN invoice or cashu token
		timestamp: 0,
		value: '0',
		mints: [],
		// keysetIds: [],
		// memo: '',
	}
	test('test methods', async () => {
		// test entry count
		expect(store.entryCount).toBe(0)
		// set values
		await store.add(entry)
		// test entry count
		expect(store.entryCount).toBe(1)
		// test get value
		expect(await store.getHistory()).toStrictEqual([entry])
		// test get value
		expect(await store.getHistoryWithKeys()).toStrictEqual([{ key: '0', value: entry }])
		await store.clear()
		// test clear
		expect(await store.getHistory()).toStrictEqual([])
		// test entry count
		expect(store.entryCount).toBe(0)
		// set values
		await store.add(entry)
		await store.add(entry)
		// test entry count
		expect(store.entryCount).toBe(2)
		// test get value
		expect(await store.getHistoryWithKeys()).toStrictEqual([
			{ key: '1', value: entry },
			{ key: '0', value: entry },
		])
		// test get value with limit
		expect(await store.getHistoryWithKeys({ count: 1 })).toStrictEqual([
			{ key: '1', value: entry },
		])
		// test get value skip first item
		expect(await store.getHistoryWithKeys({ start: 1 })).toStrictEqual([
			{ key: '0', value: entry },
		])
	})
})