import { l } from "@src/logger";
import { Mint } from "@src/storage/db/repo/MintRepository";
import { knownMintsEvents, proofEvents } from "@src/util/events";
import { mintService } from "@src/services/MintService";
import { proofService } from "@src/services/ProofService";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

export type KnownMintWithBalance = Mint & { balance: number };

const useKnownMintsInternal = () => {
  const [knownMints, setKnownMints] = useState<KnownMintWithBalance[]>([]);
  const [loading, setLoading] = useState(false);

  // Use refs to track update state and prevent unnecessary queries
  const updateTimeoutRef = useRef<NodeJS.Timeout>(null);
  const lastUpdateRef = useRef<number>(0);
  const CACHE_DURATION = 1000; // 1 second cache

  const getKnownMints = useCallback(async () => {
    // Prevent multiple concurrent calls
    if (loading) return;

    // Check if we recently updated (simple caching)
    const now = Date.now();
    if (now - lastUpdateRef.current < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    try {
      const [knownMintsData, readyProofs] = await Promise.all([
        mintService.getAllMints(),
        proofService.getProofsByState("ready"),
      ]);

      // Use Map for O(1) lookup performance
      const balancesMap = new Map<string, number>();
      readyProofs.forEach((p) => {
        balancesMap.set(
          p.mintUrl,
          (balancesMap.get(p.mintUrl) || 0) + p.amount
        );
      });

      const knownMintsWithBalance: KnownMintWithBalance[] = knownMintsData.map(
        (mint) => ({
          ...mint,
          balance: balancesMap.get(mint.mintUrl) || 0,
        })
      );

      setKnownMints(knownMintsWithBalance);
      lastUpdateRef.current = now;
    } catch (error) {
      l(error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    void getKnownMints();

    const handleUpdate = () => {
      // Clear existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Debounce updates with 300ms delay (increased from 100ms)
      updateTimeoutRef.current = setTimeout(() => {
        void getKnownMints();
      }, 300);
    };

    knownMintsEvents.on("knownMintsUpdated", handleUpdate);
    proofEvents.on("proofsUpdated", handleUpdate);

    return () => {
      knownMintsEvents.off("knownMintsUpdated", handleUpdate);
      proofEvents.off("proofsUpdated", handleUpdate);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [getKnownMints]);

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
