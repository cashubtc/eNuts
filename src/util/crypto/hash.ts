import { sha256 } from '@noble/hashes/sha256'
import { isBuf } from '@util'
import { Buffer } from 'buffer/'

import type { Buf, BytesFormat, Format, Uint8Arr } from './types'
import { uint8ArrTo } from './utils'

/**
 * Hashes a string/buffer/Uint8Array using sha256
 *
 * if format is not specified, it will default to hex
 * @export
 * @param {(string | Buffer | Uint8Array)} data string | Buffer | Uint8Array
 * @param {Format} [format] Format = "base64" | "hex" optional default is hex
 * @return {*}  {string} string
 */
export function hash256(data: string | Buffer | Uint8Array, format?: Exclude<Format, 'utf8'>): string
/**
 * Hashes a string/buffer/Uint8Array using sha256
 *
 * @export
 * @param {(string | Buffer | Uint8Array)} data string | Buffer | Uint8Array
 * @param {Buf} format 'buf'
 * @return {*}  {Buffer} Buffer
 */
export function hash256(data: string | Buffer | Uint8Array, format: Buf): Buffer

/**
 * Hashes a string/buffer/Uint8Array using sha256
 *
 * @export
 * @param {(string | Buffer | Uint8Array)} data string | Buffer | Uint8Array
 * @param {Uint8Arr} format 'uint8arr'
 * @returns {*}  {Uint8Array} Uint8Array
 */
export function hash256(data: string | Buffer | Uint8Array, format: Uint8Arr): Uint8Array
export function hash256(data: string | Buffer | Uint8Array, format: BytesFormat = 'hex') {
	if (isBuf(data)) { data = new Uint8Array(data.buffer) }
	return uint8ArrTo(sha256(data), format)
}
