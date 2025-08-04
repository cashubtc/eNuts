import { getDecodedToken, Token } from "@cashu/cashu-ts";
import { l } from "@src/logger";
import { proofService } from "@src/services/ProofService";
import { walletService } from "@src/wallet/services/WalletService";
import { useEffect, useRef, useState } from "react";

export const useCheckSpent = (token: Token) => {
    const [spent, setSpent] = useState(false);
    const isMarkedAsSpent = useRef(false);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        let isCancelled = false;

        const checkProofsSpent = async () => {
            if (!token) return;
            if (token) {
                try {
                    const wallet = await walletService.getWallet(token.mint);
                    const subscription = await wallet.onProofStateUpdates(
                        token.proofs,
                        async (p) => {
                            if (p.state === "SPENT") {
                                if (!isCancelled && !isMarkedAsSpent.current) {
                                    isMarkedAsSpent.current = true;
                                    console.log(
                                        "Payment sent! Marking proofs as used."
                                    );
                                    await proofService.setProofsState(
                                        token.proofs,
                                        "used"
                                    );
                                    setSpent(true);
                                }
                            }
                        },
                        (e) => {
                            l(e);
                        }
                    );

                    if (isCancelled) {
                        subscription();
                    } else {
                        unsub = subscription;
                    }
                } catch (e) {
                    l(e);
                }
            }
        };

        void checkProofsSpent();

        return () => {
            isCancelled = true;
            if (unsub) {
                unsub();
            }
        };
    }, [token]);

    return spent;
};
