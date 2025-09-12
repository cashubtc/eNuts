/* eslint-disable require-await */
import { l } from "@src/logger";
import { createContext, useContext, useEffect, useState } from "react";
import { useManager } from "./Manager";

const useBalance = () => {
  const [balance, setBalance] = useState<{
    [mintUrl: string]: number;
    total: number;
  }>({ total: 0 });
  const manager = useManager();

  useEffect(() => {
    async function getBalance() {
      try {
        const bal = await manager.wallet.getBalances();
        const total = Object.values(bal || {}).reduce(
          (acc, cur) => acc + cur,
          0
        );
        console.log("bal", bal);
        console.log("total", total);
        setBalance({ ...(bal || {}), total });
      } catch (error) {
        l(error);
      }
    }
    getBalance();
    manager.on("proofs:saved", getBalance);
    manager.on("proofs:state-changed", getBalance);
    return () => {
      manager.off("proofs:saved", getBalance);
      manager.off("proofs:state-changed", getBalance);
    };
  }, [manager]);

  return {
    balance,
  };
};
type useBalanceType = ReturnType<typeof useBalance>;

const BalanceCtx = createContext<useBalanceType>({
  balance: { total: 0 },
});

export const useBalanceContext = () => useContext(BalanceCtx);

export const BalanceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <BalanceCtx.Provider value={useBalance()}>{children}</BalanceCtx.Provider>
);
