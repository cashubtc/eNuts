import { getDecodedToken } from "@cashu/cashu-ts";
import { l } from "@src/logger";
import { proofService } from "@src/services/ProofService";
import { walletService } from "@src/wallet/services/WalletService";
import { useEffect, useRef, useState } from "react";

export const useCheckSpent = (value: string) => {
    const [spent, setSpent] = useState(false);
    const isMarkedAsSpent = useRef(false);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        let isCancelled = false;

        const checkProofsSpent = async () => {
            if (!value) return;
            const decodedToken = getDecodedToken(value);
            if (decodedToken) {
                try {
                    const wallet = await walletService.getWallet(
                        decodedToken.mint
                    );
                    const subscription = await wallet.onProofStateUpdates(
                        decodedToken.proofs,
                        async (p) => {
                            if (p.state === "SPENT") {
                                if (!isCancelled && !isMarkedAsSpent.current) {
                                    isMarkedAsSpent.current = true;
                                    console.log(
                                        "Payment sent! Marking proofs as used."
                                    );
                                    const proofIds = decodedToken.proofs.map(
                                        (pr) => pr.id
                                    );
                                    await proofService.setProofsState(
                                        proofIds,
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
    }, [value]);

    return spent;
};
