import AsyncStorage from '@react-native-async-storage/async-storage'
import { AsyncStore } from '@store/AsyncStore'

// fixtures
const VALUE_OBJECT = { x: 1 }
const VALUE_STRING = JSON.stringify(VALUE_OBJECT)
const KEY = 'something'

const AsyncStorageMock = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('test AsyncStore', () => {
	beforeEach(() => {
		AsyncStorageMock.getItem.mockResolvedValueOnce(Promise.resolve(VALUE_STRING))
	})
	afterEach(() => jest.clearAllMocks())

	test('AsyncStore getObj', async () => {
		const value = await AsyncStore.getObj<typeof VALUE_OBJECT>(KEY)
		expect(value).toEqual(JSON.parse(VALUE_STRING))
		expect(AsyncStorage.getItem).toHaveBeenCalledWith(KEY)
		// bad case
		expect(await AsyncStore.getObj<typeof VALUE_OBJECT>(KEY)).toBe(null)
	})

	test('AsyncStore get', async () => {
		const value = await AsyncStore.get(KEY)
		expect(value).toEqual(VALUE_STRING)
		expect(AsyncStorage.getItem).toHaveBeenCalledWith(KEY)
		// bad case
		expect(await AsyncStore.get(KEY)).toBe(null)
	})

	test('AsyncStore setObj', async () => {
		await AsyncStore.setObj(KEY, VALUE_OBJECT)
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY, VALUE_STRING)
		// bad case
		expect(() => AsyncStore.setObj(KEY, BigInt(0) as unknown as object)).toThrow(
			'Do not know how to serialize a BigInt'
		)
	})

	test('AsyncStore set', async () => {
		await AsyncStore.set(KEY, VALUE_STRING)
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY, VALUE_STRING)
		// bad case
		// await expect(()=>AsyncStore.set(KEY, undefined as unknown as string)).rejects.toThrow()
	})

	test('AsyncStore delete', async () => {
		await AsyncStore.delete(KEY)
		expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY)
	})

	test('AsyncStore clear', async () => {
		await AsyncStore.clear()
		expect(AsyncStorage.clear).toHaveBeenCalledWith()
	})

	test('AsyncStore keys', async () => {
		await AsyncStore.keys()
		expect(AsyncStorage.getAllKeys).toHaveBeenCalledWith()
	})

	test('AsyncStore getMany', async () => {
		await AsyncStore.getMany([])
		expect(AsyncStorage.multiGet).toHaveBeenCalledWith([])
	})
	test('AsyncStore getManyObj', async () => {
		await AsyncStore.getManyObj([])
		expect(AsyncStorage.multiGet).toHaveBeenCalledWith([])
	})
	test('AsyncStore setMany', async () => {
		await AsyncStore.setMany([])
		expect(AsyncStorage.multiSet).toHaveBeenCalledWith([])
	})
})
