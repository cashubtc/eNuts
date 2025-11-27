import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Default preset amounts (in sats)
export const DEFAULT_PRESETS = [
  5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
];

// Special value for "no limit"
export const NO_LIMIT = -1;

interface INfcAmountLimitsContext {
  defaultMaxAmount: number;
  customAmounts: number[];
  isLoading: boolean;
  selectDefault: (amount: number) => Promise<void>;
  addAmount: (amount: number) => Promise<boolean>;
  removeAmount: (amount: number) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const useNfcAmountLimitsState = () => {
  const [defaultMaxAmount, setDefaultMaxAmount] = useState<number>(NO_LIMIT);
  const [customAmounts, setCustomAmounts] = useState<number[]>(DEFAULT_PRESETS);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const savedMaxAmount = await store.get(STORE_KEYS.nfcDefaultMaxAmount);
        if (savedMaxAmount !== null) {
          setDefaultMaxAmount(parseInt(savedMaxAmount, 10));
        }

        const savedCustomAmounts = await store.get(STORE_KEYS.nfcCustomAmounts);
        if (savedCustomAmounts) {
          const parsed = JSON.parse(savedCustomAmounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomAmounts(parsed);
          }
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
  const selectDefault = useCallback(async (amount: number) => {
    setDefaultMaxAmount(amount);
    await store.set(STORE_KEYS.nfcDefaultMaxAmount, amount.toString());
  }, []);

  // Add new amount - returns true if added, false if invalid or duplicate
  const addAmount = useCallback(
    async (amount: number): Promise<boolean> => {
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      // Don't add duplicates
      if (customAmounts.includes(amount)) {
        return false;
      }

      const newAmounts = [...customAmounts, amount].sort((a, b) => a - b);
      setCustomAmounts(newAmounts);
      await store.set(STORE_KEYS.nfcCustomAmounts, JSON.stringify(newAmounts));
      return true;
    },
    [customAmounts]
  );

  // Remove custom amount
  const removeAmount = useCallback(
    async (amount: number) => {
      // Don't allow removing if it's the only one left
      if (customAmounts.length <= 1) return;

      const newAmounts = customAmounts.filter((a) => a !== amount);
      setCustomAmounts(newAmounts);
      await store.set(STORE_KEYS.nfcCustomAmounts, JSON.stringify(newAmounts));

      // If the removed amount was the default, reset to no limit
      if (defaultMaxAmount === amount) {
        setDefaultMaxAmount(NO_LIMIT);
        await store.set(STORE_KEYS.nfcDefaultMaxAmount, NO_LIMIT.toString());
      }
    },
    [customAmounts, defaultMaxAmount]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setCustomAmounts(DEFAULT_PRESETS);
    setDefaultMaxAmount(NO_LIMIT);
    await store.set(
      STORE_KEYS.nfcCustomAmounts,
      JSON.stringify(DEFAULT_PRESETS)
    );
    await store.set(STORE_KEYS.nfcDefaultMaxAmount, NO_LIMIT.toString());
  }, []);

  return {
    defaultMaxAmount,
    customAmounts,
    isLoading,
    selectDefault,
    addAmount,
    removeAmount,
    resetToDefaults,
  };
};

const NfcAmountLimitsContext = createContext<INfcAmountLimitsContext>({
  defaultMaxAmount: NO_LIMIT,
  customAmounts: DEFAULT_PRESETS,
  isLoading: true,
  selectDefault: async () => {},
  addAmount: async () => false,
  removeAmount: async () => {},
  resetToDefaults: async () => {},
});

export const useNfcAmountLimitsContext = () => useContext(NfcAmountLimitsContext);

export const NfcAmountLimitsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <NfcAmountLimitsContext.Provider value={useNfcAmountLimitsState()}>
    {children}
  </NfcAmountLimitsContext.Provider>
);

export type { INfcAmountLimitsContext };

