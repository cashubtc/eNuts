// import * as Crypto from 'expo-crypto'
// import { randomBytes } from '@noble/hashes/utils'
import { l } from '@log'
import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { AES, enc, SHA256 } from 'crypto-js'

export function encrypt(
	privkey: string,
	pubkey: string,
	text: string
): string {

	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	// l({ key })

	// const normalizedKey = getNormalizedX(key)
	// l({ normalizedKey })

	// const normalizedHex = arrayBufferToHexString(normalizedKey)
	// l({ normalizedHex })

	const plaintextWordArray = enc.Utf8.parse(text)
	// l({ plaintextWordArray })

	const iv = Uint8Array.from(randomBytes(16))

	// Convert iv (Uint8Array) to WordArray
	const ivWordArray = enc.Hex.parse(arrayBufferToHexString(iv))

	// Make sure the derived key is in the expected format for AES
	const aesKey = importAesKeyFromSharedSecret(privkey, pubkey)

	// Use AES from crypto-js to perform the AES-CBC encryption
	const encrypted = AES.encrypt(plaintextWordArray, aesKey, { iv: ivWordArray })

	const ctb64 = encrypted.ciphertext.toString(enc.Base64)

	const ivb64 = enc.Base64.stringify(ivWordArray)

	return `${ctb64}?iv=${ivb64}`

}

function getNormalizedX(key: Uint8Array): Uint8Array {
	return key.slice(1, 33)
}

function arrayBufferToHexString(buffer: Uint8Array): string {
	return Array.prototype.map.call(buffer, (x: number) => ('00' + x.toString(16)).slice(-2)).join('')
}

export function importAesKeyFromSharedSecret(privkey: string, pubkey: string) {
	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	const normalizedKey = getNormalizedX(key)
	const normalizedHex = arrayBufferToHexString(normalizedKey)

	// Use SHA256 from crypto-js to derive the AES key and slice the first 16 bytes
	// eslint-disable-next-line new-cap
	const cryptoKey = SHA256(normalizedHex).toString().slice(0, 32)

	// Make sure the derived key is in the expected format for AES
	const aesKey = enc.Hex.parse(cryptoKey)

	return aesKey.toString() // Return the AES key in the expected format
}