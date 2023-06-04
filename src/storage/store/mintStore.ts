import { store } from '@store'

const KEY_SEPERATOR = '=|:|='
const MINT_STORE_KEY_PREFIX = `MINT_STORE${KEY_SEPERATOR}`
const MINT_STORE_KEY_PREFIX_NAME = `${MINT_STORE_KEY_PREFIX}NAME${KEY_SEPERATOR}`
export function getDefaultMint(): Promise<string | null | undefined> {
	return store.get(`${MINT_STORE_KEY_PREFIX}default_mint`)
}
export function setDefaultMint(value: string): Promise<boolean> {
	return store.set(`${MINT_STORE_KEY_PREFIX}default_mint`, value)
}
export function getMintName(mintUrl: string): Promise<string | null | undefined> {
	return store.get(`${MINT_STORE_KEY_PREFIX_NAME}${mintUrl}`)
}
export function _setMintName(mintUrl: string, name: string): Promise<boolean> {
	return store.set(`${MINT_STORE_KEY_PREFIX_NAME}${mintUrl}`, name)
}
export async function getMintBalWithName<T extends { mint_url: string }>(mintsBal: T[]): Promise<(T & { name: string })[]> {
	const data = (await store.getByKeyPrefix(`${MINT_STORE_KEY_PREFIX_NAME}`))
		.reduce((acc, cur) => {
			acc[cur.key.slice(MINT_STORE_KEY_PREFIX_NAME.length)] = cur.value
			return acc
		}, {} as { [key: string]: string })
	const mintsState: (T & { name: string })[] = mintsBal
		.map((m) => ({ ...m, name: data[m.mint_url] || '' }))
	return mintsState
}
