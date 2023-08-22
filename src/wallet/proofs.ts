import type { Proof, Token } from '@cashu/cashu-ts'
import { getDecodedToken } from '@cashu/cashu-ts'
import { l } from '@log'

export function getTokenInfo(encodedToken: string) {
	try {
		const decoded = getDecodedToken(encodedToken)
		const mints = new Set(decoded?.token?.map(x => x.mint))
		return { mints: [...mints], value: sumTokenValue(decoded), decoded }
	} catch (e) { l(e) }
}

export function getValueFromEncodedToken(encodedToken: string) {
	return sumTokenValue(getDecodedToken(encodedToken))
}

export function sumTokenValue(token: Token) {
	return token.token.reduce((r, c) => r + sumProofsValue(c.proofs), 0)
}

export function sumProofsValue(proofs: Proof[]) {
	return proofs.reduce((r, c) => r + c.amount, 0)
}
