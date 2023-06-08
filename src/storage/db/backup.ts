import { getEncodedToken, type Proof, type Token } from '@cashu/cashu-ts'

import { getMintByKeySetId, getProofs, getProofsByMintUrl } from '.'

async function _backUpToken(proofs: Proof[]) {
	proofs.sort((a, b) => a.id.localeCompare(b.id))
	const proofMap: { [k: string]: Proof[] } = {}
	for (const p of proofs) {
		if (!proofMap[p.id]) { proofMap[p.id] = [p] } else { proofMap[p.id].push(p) }
	}
	const ids = Object.keys(proofMap)
	const result: Token = { token: [] }
	for (const id of ids) {
		// eslint-disable-next-line no-await-in-loop
		const m = await getMintByKeySetId(id)
		if (!m || !proofMap?.[id]?.length) { continue }
		result.token.push({ mint: m.mintUrl, proofs: proofMap[id] })
	}
	return result?.token?.length ? getEncodedToken(result) : ''
}
export async function getBackUpToken() {
	return _backUpToken(await getProofs())
}
export async function getBackUpTokenForMint(mintUrl: string) {
	return _backUpToken(await getProofsByMintUrl(mintUrl))
}