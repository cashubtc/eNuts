import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { Buffer } from 'buffer/'
import cjs from 'crypto-js'

const { AES, lib, mode } = cjs

export function encrypt(privkey: string, pubkey: string, text: string) {
	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	const normalizedKey = getNormalizedX(key)
	const iv = Uint8Array.from(randomBytes(16))
	const cryptoKey = new Uint8Array(Buffer.from(normalizedKey))
	const ciphertext = AES.encrypt(text,
		byteArrayToWordArray(cryptoKey),
		{ iv: byteArrayToWordArray(iv), mode: mode.CBC, }
	)
	const ctb64 = Buffer.from(wordArrayToByteArray(ciphertext.ciphertext)).toString('base64')
	const ivb64 = Buffer.from(iv).toString('base64')
	return `${ctb64}?iv=${ivb64}`
}

function getNormalizedX(key: Uint8Array): Uint8Array {
	return key.slice(1, 33)
}

function byteArrayToWordArray(ba: Uint8Array) {
	const wa: number[] = []
	for (let i = 0; i < ba.length; i++) {
		wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i)
	}
	return lib.WordArray.create(wa, ba.length)
}

function wordArrayToByteArray(wordArray: cjs.lib.WordArray) {
	const len = wordArray.words.length
	const u8_array = new Uint8Array(len << 2)
	let	offset = 0
	let word
	for (let i = 0; i < len; i++) {
		word = wordArray.words[i]
		u8_array[offset++] = word >> 24
		u8_array[offset++] = (word >> 16) & 0xff
		u8_array[offset++] = (word >> 8) & 0xff
		u8_array[offset++] = word & 0xff
	}
	return u8_array
}