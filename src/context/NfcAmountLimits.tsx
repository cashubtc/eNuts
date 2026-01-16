import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Special value for "no limit"
export const NO_LIMIT = -1;

// Default limit in sats (50k sats)
const DEFAULT_LIMIT = 50_000;

interface INfcAmountLimitsContext {
  /** The configured default max amount (-1 = no limit) */
  defaultMaxAmount: number;
  /** Whether settings are still loading */
  isLoading: boolean;
  /** Set the default max amount */
  setDefaultMaxAmount: (amount: number) => Promise<void>;
}

const useNfcAmountLimitsState = () => {
  const [defaultMaxAmount, setDefaultMaxAmountState] = useState<number>(DEFAULT_LIMIT);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const savedMaxAmount = await store.get(STORE_KEYS.nfcDefaultMaxAmount);
        if (savedMaxAmount !== null) {
          setDefaultMaxAmountState(parseInt(savedMaxAmount, 10));
        }
      } catch (error) {
        console.error("Failed to load NFC settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadSettings();
  }, []);

  // Save default max amount
  const setDefaultMaxAmount = useCallback(async (amount: number) => {
    setDefaultMaxAmountState(amount);
    await store.set(STORE_KEYS.nfcDefaultMaxAmount, amount.toString());
  }, []);

  return {
    defaultMaxAmount,
    isLoading,
    setDefaultMaxAmount,
  };
};

const NfcAmountLimitsContext = createContext<INfcAmountLimitsContext>({
  defaultMaxAmount: DEFAULT_LIMIT,
  isLoading: true,
  setDefaultMaxAmount: async () => {},
});

export const useNfcAmountLimitsContext = () => useContext(NfcAmountLimitsContext);

export const NfcAmountLimitsProvider = ({ children }: { children: React.ReactNode }) => (
  <NfcAmountLimitsContext.Provider value={useNfcAmountLimitsState()}>
    {children}
  </NfcAmountLimitsContext.Provider>
);

export type { INfcAmountLimitsContext };
