import { hmac } from '@noble/hashes/hmac'
import { sha256 } from '@noble/hashes/sha256'

export function deriveFromSecret(purpose: string, secret: string) {
	return hmacSha256(secret, purpose)
}

export function hmacSha256(secret: string, data: string) {
	return hmac(sha256, secret, data)
}

