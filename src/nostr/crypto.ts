import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { base64 } from '@scure/base'
// import { Buffer } from 'buffer/'
import crypto from 'crypto-js'

const { AES, lib, SHA256 } = crypto

export function encrypt(
	privkey: string,
	pubkey: string,
	text: string
): string {

	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	// console.log({ key })

	const normalizedKey = getNormalizedX(key)
	// console.log({ normalizedKey })

	const iv = Uint8Array.from(randomBytes(16))
	// console.log({ iv })

	const plaintext = new TextEncoder().encode(text)
	// console.log({ plaintext })

	// eslint-disable-next-line new-cap
	const cryptoKey = SHA256(byteArrayToWordArray(normalizedKey)).toString().slice(0, 32)

	// Use AES from crypto-js to perform the AES-CBC encryption
	const ciphertext = AES.encrypt(byteArrayToWordArray(plaintext), cryptoKey, { iv: byteArrayToWordArray(iv) })

	const ctb64 = base64.encode(new Uint8Array(wordArrayToByteArray(ciphertext.ciphertext).buffer))
	const ivb64 = base64.encode(new Uint8Array(iv.buffer))

	return `${ctb64}?iv=${ivb64}`

}

function byteArrayToWordArray(ba: Uint8Array) {
	const wa: number[] = []
	for (let i = 0; i < ba.length; i++) {
		wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i)
	}

	return lib.WordArray.create(wa, ba.length)
}

function getNormalizedX(key: Uint8Array): Uint8Array {
	return key.slice(1, 33)
}

function wordArrayToByteArray(wordArray: any) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	const len = wordArray.words.length
	const u8_array = new Uint8Array(len << 2)
	let offset = 0
	let word

	for (let i = 0; i < len; i++) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		word = wordArray.words[i]
		u8_array[offset++] = word >> 24
		u8_array[offset++] = (word >> 16) & 0xff
		u8_array[offset++] = (word >> 8) & 0xff
		u8_array[offset++] = word & 0xff
	}
	return u8_array
}