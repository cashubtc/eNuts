import { hasTrustedMint } from '@util'


describe('test utils', () => {
	const userMints = ['mint1', 'mint2', 'mint3']
	const userMintsObjArr = [{ mintUrl: 'mint1' }, { mintUrl: 'mint2' }, { mintUrl: 'mint3' }]
	test('test utils hasTrustedMint true case', () => {
		const tokenMints: string[] = ['mint1']
		expect(hasTrustedMint(userMints, tokenMints)).toBe(true)
		expect(hasTrustedMint(userMintsObjArr, tokenMints)).toBe(true)
	})

	test('test utils hasTrustedMint false case', () => {
		const tokenMints: string[] = ['mint9']
		expect(hasTrustedMint(userMints, tokenMints)).toBe(false)
		expect(hasTrustedMint(userMintsObjArr, tokenMints)).toBe(false)
	})
	test('test utils hasTrustedMint bad case', () => {
		const tokenMints: string[] = ['mint9']
		expect(hasTrustedMint([], tokenMints)).toBe(false)
		expect(hasTrustedMint(userMints, [])).toBe(false)

		expect(hasTrustedMint([], tokenMints)).toBe(false)
		expect(hasTrustedMint(userMintsObjArr, [])).toBe(false)

		expect(hasTrustedMint([], [])).toBe(false)

		expect(hasTrustedMint(undefined as unknown as string[], tokenMints)).toBe(false)
		expect(hasTrustedMint(userMints, undefined as unknown as string[])).toBe(false)
		expect(hasTrustedMint(userMintsObjArr, undefined as unknown as string[])).toBe(false)
	})
})
