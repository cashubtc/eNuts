/* eslint-disable require-await */
import { l } from "@src/logger";
import { proofService } from "@src/services/ProofService";
import { proofRepository } from "@src/storage/db/repo/ProofRepository";
import { proofEvents } from "@src/util/events";
import { createContext, useContext, useEffect, useState } from "react";

const useBalance = () => {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        async function getBalance() {
            try {
                const bal = await proofService.getBalance();
                setBalance(bal);
            } catch (error) {
                l(error);
            }
        }
        getBalance();
        proofEvents.on("proofsUpdated", getBalance);
    }, []);

    return {
        balance,
    };
};
type useBalanceType = ReturnType<typeof useBalance>;

const BalanceCtx = createContext<useBalanceType>({
    balance: 0,
});

export const useBalanceContext = () => useContext(BalanceCtx);

export const BalanceProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <BalanceCtx.Provider value={useBalance()}>{children}</BalanceCtx.Provider>
);
