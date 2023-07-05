import { Buffer } from 'buffer/'

import { BytesFormat } from './types'

export function uint8ArrTo(result: Uint8Array, format: BytesFormat = 'hex') {
	if (format === 'uint8Arr') { return result }
	if (format === 'base64') { return Buffer.from(result).toString('base64') }
	if (format === 'hex') { return Buffer.from(result).toString('hex') }
	if (format === 'buf') { return Buffer.from(result.buffer) }
	if(format==='utf8'){ return Buffer.from(result).toString('utf8') }
	throw new Error('[uint8ArrTo] invalid format')
}