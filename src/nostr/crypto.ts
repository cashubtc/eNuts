import { secp256k1 } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'
import { l } from '@src/logger'
import { isErr } from '@src/util'
import { Buffer } from 'buffer/'
import { AES, enc, lib, mode } from 'crypto-js'

function getEncKey(privkey: string, pubkey: string) {
	const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
	return key.slice(1, 33)
}
export function encrypt(privkey: string, pubkey: string, text: string) {
	const iv = randomBytes(16)
	const cryptoKey = getEncKey(privkey, pubkey)
	const ciphertext = AES.encrypt(
		text,
		bytesToWordArr(cryptoKey),
		{ iv: bytesToWordArr(iv), mode: mode.CBC }
	).ciphertext
	const ctb64 = enc.Base64.stringify(ciphertext)
	const ivb64 = Buffer.from(iv).toString('base64')
	return `${ctb64}?iv=${ivb64}`
}
export function decrypt(privkey: string, pubkey: string, data: string) {
	const [ctb64, ivb64] = data.split('?iv=')
	const iv = Buffer.from(ivb64, 'base64')
	const cryptoKey = getEncKey(privkey, pubkey)
	const ciphertext = Buffer.from(ctb64, 'base64')
	try {
		const decrypted = AES.decrypt(
			lib.CipherParams.create({ ciphertext: bytesToWordArr(ciphertext) }),
			bytesToWordArr(cryptoKey),
			{ iv: bytesToWordArr(iv), mode: mode.CBC }
		)
		return decrypted.toString(enc.Utf8)
	} catch (e) {
		l(isErr(e) ? e.message : e)
		return ''
	}
}
function bytesToWordArr(ba: Uint8Array) {
	const wa: number[] = []
	for (let i = 0; i < ba.length; i++) {
		wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i)
	}
	return lib.WordArray.create(wa, ba.length)
}

