
import { getDatabase as mockGetDatabase } from './wrapper/getTestDb'

jest.mock('expo-sqlite', () => ({
	get openDatabase() {
		return (_: string) => mockGetDatabase(':memory:')
	}
}))

import { SimpleKeyValueStore } from '@store'

describe('test SimpleKeyValueStore', () => {
	afterAll(async () => { await store.close() })
	const store = new SimpleKeyValueStore('store')

	test('test methods', async () => {
		// set values
		await store.set('key', 'value')
		await store.set('testkey', 'valuetest')
		await store.set('key2', 'value2')
		await store.setObj('objKey', { object: 'objProp' })
		// test get value
		expect(await store.get('key')).toBe('value')
		// test get value
		expect(await store.getObj<{ object: string }>('objKey')).toMatchObject({ object: 'objProp' })
		// update value
		await store.set('key', 'valueUpdated')
		expect(await store.get('key')).toBe('valueUpdated')
		// update obj value
		await store.setObj<{ object: string }>('objKey', { object: 'objPropUpdated' })
		expect(await store.getObj('objKey')).toMatchObject({ object: 'objPropUpdated' })
		// test get keys
		expect(await store.keys()).toStrictEqual(["testkey", "key2", "key", "objKey"])
		// test get keys with prefix
		expect(await store.keysByPrefix('test')).toStrictEqual(["testkey"])
		// test get by prefix
		expect(await store.getByKeyPrefix('test')).toMatchObject([{ key: 'testkey', value: 'valuetest' }])
		// test get obj by prefix
		expect(await store.getObjsByKeyPrefix<{ object: string }>('objKey')).toMatchObject([{ key: 'objKey', value: { object: 'objPropUpdated' } }])
		// test get all
		expect(await store.getAll()).toMatchObject([
			{ key: "testkey", value: "valuetest" },
			{ key: "key2", value: "value2" },
			{ key: "key", value: "valueUpdated" },
			{ key: "objKey", value: '{"object":"objPropUpdated"}' }
		])
		await store.clear()
		// test clear
		expect(await store.keys()).toStrictEqual([])
		await store.setObj('objKey', { object: 'objProp' })
		expect(await store.getObjsAll<{ object: string }>())
			.toMatchObject([{ key: 'objKey', value: { object: 'objProp' } }])
		expect(await store.count()).toBe(1)
		// test special chars
		expect(await store.set('? : // = \\ \' ´ § ¶ ± « » ° £ ¥ € ® © § ¶ ± « » �', 'value'))
		expect(await store.count()).toBe(2)
		expect(await store.get('? : // = \\ \' ´ § ¶ ± « » ° £ ¥ € ® © § ¶ ± « » �')).toBe('value')
	})
})