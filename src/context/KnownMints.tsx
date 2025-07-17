import { l } from "@src/logger";
import { KnownMint } from "@src/storage/db/repo/MintRepository";
import { knownMintsEvents, proofEvents } from "@src/util/events";
import { mintService } from "@src/wallet/services/MintService";
import { proofService } from "@src/services/ProofService";
import { createContext, useContext, useState, useEffect } from "react";

export type KnownMintWithBalance = KnownMint & { balance: number };

const useKnownMintsInternal = () => {
    const [knownMints, setKnownMints] = useState<KnownMintWithBalance[]>([]);

    useEffect(() => {
        async function getKnownMints() {
            try {
                const knownMints = await mintService.getAllKnownMints();
                const readyProofs = await proofService.getProofsByState(
                    "ready"
                );

                const balances = readyProofs.reduce((acc, p) => {
                    acc[p.mintUrl] = (acc[p.mintUrl] || 0) + p.amount;
                    return acc;
                }, {} as Record<string, number>);

                const knownMintsWithBalance: KnownMintWithBalance[] =
                    knownMints.map((mint) => ({
                        ...mint,
                        balance: balances[mint.mintUrl] || 0,
                    }));

                setKnownMints(knownMintsWithBalance);
            } catch (error) {
                l(error);
            }
        }
        getKnownMints();
        knownMintsEvents.on("knownMintsUpdated", getKnownMints);
        proofEvents.on("proofsUpdated", getKnownMints);
        return () => {
            knownMintsEvents.off("knownMintsUpdated", getKnownMints);
            proofEvents.off("proofsUpdated", getKnownMints);
        };
    }, []);
    return { knownMints };
};

type UseKnownMintsType = ReturnType<typeof useKnownMintsInternal>;

const KnownMintsCtx = createContext<UseKnownMintsType>({
    knownMints: [],
});

export const useKnownMints = () => useContext(KnownMintsCtx);

export const KnownMintsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <KnownMintsCtx.Provider value={useKnownMintsInternal()}>
        {children}
    </KnownMintsCtx.Provider>
);
