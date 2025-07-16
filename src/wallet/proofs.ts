import type { Proof, Token } from "@cashu/cashu-ts";
import { getDecodedToken } from "@cashu/cashu-ts";
import { l } from "@log";
import { uniq } from "@util";

export function getTokenInfo(encodedToken: string) {
    try {
        const decoded = getDecodedToken(encodedToken);
        return {
            mints: [decoded.mint],
            value: sumProofsValue(decoded.proofs),
            decoded: decoded,
        };
    } catch (e) {
        l(e);
    }
}

export function getValueFromEncodedToken(encodedToken: string) {
    const decoded = getDecodedToken(encodedToken);
    return sumProofsValue(decoded.proofs);
}

export function sumTokenValue(token: Token) {
    return sumProofsValue(token.proofs);
}

export function sumProofsValue(proofs: Proof[]) {
    return proofs.reduce((r, c) => r + c.amount, 0);
}

export function sumTokenProofs(token: Token) {
    return token.proofs.length;
}
