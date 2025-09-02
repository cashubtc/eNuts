import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useManager } from "./Manager";
import { Mint } from "coco-cashu-core";

export type KnownMintWithBalance = Mint & { balance: number };

const useKnownMintsInternal = () => {
  const [knownMints, setKnownMints] = useState<KnownMintWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const manager = useManager();

  const getKnownMints = useCallback(async () => {
    const mints = await manager.mint.getAllMints();
    const balances = await manager.wallet.getBalances();

    const knownMintsWithBalance: KnownMintWithBalance[] = mints.map((mint) => ({
      ...mint,
      balance: balances[mint.mintUrl] || 0,
    }));

    setKnownMints(knownMintsWithBalance);
  }, []);

  useEffect(() => {
    void getKnownMints();

    manager.on("mint:added", getKnownMints);
    manager.on("mint:updated", getKnownMints);

    return () => {
      manager.off("mint:added", getKnownMints);
      manager.off("mint:updated", getKnownMints);
    };
  }, [getKnownMints, manager]);

  return useMemo(() => ({ knownMints, loading }), [knownMints, loading]);
};

type UseKnownMintsType = ReturnType<typeof useKnownMintsInternal>;

const KnownMintsCtx = createContext<UseKnownMintsType>({
  knownMints: [],
  loading: false,
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
