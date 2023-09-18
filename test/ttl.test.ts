import { TTLCache } from '@src/storage/store/ttl'


describe('ttl', () => {
	const store = new TTLCache('__ttlCache__', 500)
	beforeEach(async () => { await store.clear() })
	afterAll(async () => { await store.clear() })
	test('set string', async () => {
		await store.set('a', 'a')
		expect(await store.get('a')).toBe('a')
		await new Promise((resolve) => setTimeout(resolve, 1500))
		expect(await store.get('a')).toBeFalsy()
	})
	test('set <T>', async () => {
		await store.setObj('o', { a: 'a' })
		expect(await store.getObj('o')).toStrictEqual({ a: 'a' })
		await new Promise((resolve) => setTimeout(resolve, 1500))
		expect(await store.getObj('o')).toBeFalsy()
	})
})
