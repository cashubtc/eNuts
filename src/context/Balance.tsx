/* eslint-disable require-await */
import { proofRepository } from "@src/storage/db/repo/ProofRepository";
import { proofEvents } from "@src/util/events";
import { createContext, useContext, useEffect, useState } from "react";

const useBalance = () => {
    const [balance, setBalance] = useState<number>();

    useEffect(() => {
        async function getBalance() {
            const bal = await proofRepository.getReadyProofsAmount();
            setBalance(bal);
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
