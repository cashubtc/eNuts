import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { AES, enc, SHA256 } from 'crypto-js'

export function encrypt(
	privkey: string,
	pubkey: string,
	text: string
): string {

	const plaintextWordArray = enc.Utf8.parse(text)
	const iv = Uint8Array.from(randomBytes(16))
	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	const normalizedKey = getNormalizedX(key)

	// Convert iv (Uint8Array) to WordArray
	// const ivWordArray = enc.Hex.parse(arrayBufferToHexString(iv))

	// const normalizedHex = arrayBufferToHexString(normalizedKey)

	// Make sure the derived key is in the expected format for AES
	// const aesKey = importAesKeyFromSharedSecret(privkey, pubkey)
	// eslint-disable-next-line new-cap
	const cryptoKey = SHA256(byteArrayToWordArray(normalizedKey)).toString().slice(0, 32)

	// Use AES from crypto-js to perform the AES-CBC encryption
	const encrypted = AES.encrypt(plaintextWordArray, cryptoKey, { iv: byteArrayToWordArray(iv) })

	const ctb64 = encrypted.ciphertext.toString(enc.Base64)

	// Combine the Base64 ciphertext and IV to form the final result
	const ivb64 = Buffer.from(iv).toString('base64')

	return `${ctb64}?iv=${ivb64}`

}

function byteArrayToWordArray(ba: Uint8Array) {
	const wa: number[] = []
	for (let i = 0; i < ba.length; i++) {
		wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i)
	}

	return CryptoJS.lib.WordArray.create(wa, ba.length)
}

function getNormalizedX(key: Uint8Array): Uint8Array {
	return key.slice(1, 33)
}

// function arrayBufferToHexString(buffer: Uint8Array): string {
// 	return Array.prototype.map.call(buffer, (x: number) => ('00' + x.toString(16)).slice(-2)).join('')
// }

// export function importAesKeyFromSharedSecret(privkey: string, pubkey: string) {
// 	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
// 	const normalizedKey = getNormalizedX(key)
// 	const normalizedHex = arrayBufferToHexString(normalizedKey)

// 	// Use SHA256 from crypto-js to derive the AES key and slice the first 16 bytes
// 	// eslint-disable-next-line new-cap
// 	const cryptoKey = SHA256(normalizedHex).toString().slice(0, 32)

// 	// Make sure the derived key is in the expected format for AES
// 	const aesKey = enc.Hex.parse(cryptoKey)

// 	return aesKey.toString() // Return the AES key in the expected format
// }