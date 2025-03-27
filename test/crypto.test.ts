import { hash256 } from '@util/crypto'
import { Buffer } from 'buffer/'

describe('test crypto', () => {
	// const rawData = Buffer.from(readFileSync('./assets/favicon.png'))
	// const base64Data = rawData.toString('base64')
	// const hexData = rawData.toString('hex')

	const key = 'my secret key'

	test('hash256', () => {
		const hash = 'b16920894899c7780b5fc7161560a4120e26723be4f187462291225157ba82c4'
		expect(hash256(key)).toBe(hash)
		expect(hash256(key, 'hex')).toBe(hash)
		expect(hash256(key, 'base64'))
			.toBe('sWkgiUiZx3gLX8cWFWCkEg4mcjvk8YdGIpEiUVe6gsQ=')
		expect(hash256(key, 'buf').toString('hex')).toBe(hash)
		expect(Buffer.from(hash256(key, 'uint8Arr')).toString('hex')).toBe(hash)

	})
})