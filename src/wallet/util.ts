import type { Proof } from "@cashu/cashu-ts";
import { getProofsByMintUrl } from "@db";
import { isCashuToken } from "@util";

export async function getProofsToUse(
    mintUrl: string,
    amount: number,
    order: "asc" | "desc" = "desc"
) {
    const usableProofs = await getProofsByMintUrl(mintUrl);
    const proofsToSend: Proof[] = [];
    let amountAvailable = 0;
    if (order === "desc") {
        usableProofs.sort((a, b) => b.amount - a.amount);
    } else {
        usableProofs.sort((a, b) => a.amount - b.amount);
    }
    usableProofs.forEach((proof) => {
        if (amountAvailable >= amount) {
            return;
        }
        amountAvailable = amountAvailable + proof.amount;
        proofsToSend.push(proof);
    });
    return { proofsToUse: proofsToSend };
}

export function isValidCashuToken(
    token: string | null | undefined
): string | null {
    if (!token) return null;
    const cleaned = isCashuToken(token);
    return cleaned || null;
}
