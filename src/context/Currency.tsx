import { appLogger } from "@src/logger";
import type { IExchangeRates, IFormattedAmount, TCurrencyCode } from "@model";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { exchangeRateService } from "@src/services/ExchangeRateService";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { formatInt } from "@util";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CURRENCY = "USD";

interface ICurrencyContext {
  rates: IExchangeRates | null;
  selectedCurrency: TCurrencyCode;
  setSelectedCurrency: (currency: TCurrencyCode) => Promise<void>;
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  refreshRates: () => Promise<void>;
  formatSatsAsCurrency: (sats: number, currencyCode?: TCurrencyCode) => string;
  formatBalance: boolean;
  setFormatBalance: (value: boolean) => Promise<void>;
  formatAmount: (sats: number) => IFormattedAmount;
  convertFiatToSats: (
    fiatAmount: number,
    currencyCode?: TCurrencyCode
  ) => number;
}

const useCurrency = () => {
  const [rates, setRates] = useState<IExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrencyState] =
    useState<TCurrencyCode>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatBalance, setFormatBalanceState] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  // Ref to track current rates for use in async callbacks (avoids stale closures)
  const ratesRef = useRef<IExchangeRates | null>(null);

  /**
   * Load cached rates and preferences from storage
   */
  const loadFromStorage = async () => {
    try {
      // Load cached exchange rates
      const cachedRates = await store.get(STORE_KEYS.exchangeRates);
      if (cachedRates) {
        const parsedRates = JSON.parse(cachedRates) as IExchangeRates;
        if (exchangeRateService.validateRates(parsedRates)) {
          setRates(parsedRates);
          appLogger.debug("Currency: Loaded cached exchange rates");
        }
      }

      // Load cached timestamp
      const cachedTimestamp = await store.get(
        STORE_KEYS.exchangeRatesTimestamp
      );
      if (cachedTimestamp) {
        setLastUpdate(parseInt(cachedTimestamp, 10));
      }

      // Load selected currency preference
      const savedCurrency = await store.get(STORE_KEYS.selectedCurrency);
      if (savedCurrency) {
        setSelectedCurrencyState(savedCurrency);
        appLogger.debug("Currency: Loaded selected currency", {
          currency: savedCurrency,
        });
      }

      // Load format balance preference
      const savedFormatBalance = await store.get(STORE_KEYS.formatBalance);
      if (savedFormatBalance !== null) {
        setFormatBalanceState(savedFormatBalance === "true");
        appLogger.debug("Currency: Loaded format balance preference", {
          formatBalance: savedFormatBalance,
        });
      }
    } catch (err) {
      appLogger.error("Currency: Failed to load from storage", err);
    }
  };

  // Keep ratesRef in sync with rates state
  useEffect(() => {
    ratesRef.current = rates;
  }, [rates]);

  /**
   * Fetch fresh exchange rates from API
   */
  const fetchRates = async () => {
    try {
      setError(null);
      const freshRates = await exchangeRateService.fetchRates();

      if (exchangeRateService.validateRates(freshRates)) {
        setRates(freshRates);
        const now = Date.now();
        setLastUpdate(now);

        // Persist to storage
        await store.set(STORE_KEYS.exchangeRates, JSON.stringify(freshRates));
        await store.set(STORE_KEYS.exchangeRatesTimestamp, now.toString());

        appLogger.info("Currency: Successfully updated exchange rates");
      } else {
        throw new Error("Invalid rates format received from API");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      appLogger.error("Currency: Failed to fetch exchange rates", err);
      setError(errorMessage);

      // If we have no cached rates, this is a critical error
      // Use ref to avoid stale closure issue
      if (!ratesRef.current) {
        setError(
          "Unable to load exchange rates. Please check your internet connection."
        );
      }
    }
  };

  /**
   * Initialize currency context
   */
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);

      // Load cached data first
      await loadFromStorage();

      // Then fetch fresh data
      await fetchRates();

      setIsLoading(false);
      setIsInitialized(true);
    }

    void initialize();
  }, []);

  /**
   * Set up periodic refresh interval
   */
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      appLogger.debug("Currency: Periodic refresh triggered");
      void fetchRates();
    }, REFRESH_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInitialized]);

  /**
   * Handle app state changes (pause/resume)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // App coming back to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        appLogger.debug("Currency: App resumed, fetching fresh rates");
        void fetchRates();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Update selected currency and persist to storage
   */
  const setSelectedCurrency = async (currency: TCurrencyCode) => {
    try {
      // Validate currency exists in rates
      if (rates && !rates[currency]) {
        appLogger.warn("Currency: Attempted to select invalid currency", {
          currency,
        });
        return;
      }

      setSelectedCurrencyState(currency);
      await store.set(STORE_KEYS.selectedCurrency, currency);
      appLogger.info("Currency: Selected currency updated", { currency });
    } catch (err) {
      appLogger.error("Currency: Failed to update selected currency", err);
    }
  };

  /**
   * Manual refresh function exposed to consumers
   */
  const refreshRates = async () => {
    appLogger.debug("Currency: Manual refresh requested");
    await fetchRates();
  };

  /**
   * Update format balance preference and persist to storage
   */
  const setFormatBalance = async (value: boolean) => {
    try {
      setFormatBalanceState(value);
      await store.set(STORE_KEYS.formatBalance, value.toString());
      appLogger.info("Currency: Format balance preference updated", { value });
    } catch (err) {
      appLogger.error(
        "Currency: Failed to update format balance preference",
        err
      );
    }
  };

  /**
   * Convert satoshis to formatted currency string
   * @param sats - Amount in satoshis
   * @param currencyCode - Optional currency code (defaults to selectedCurrency)
   * @returns Formatted number (e.g., "123.45", "0.11") without currency symbol
   */
  const formatSatsAsCurrency = (
    sats: number,
    currencyCode?: TCurrencyCode
  ): string => {
    // Use provided currency or fall back to selected currency
    const currency = currencyCode || selectedCurrency;

    // Return empty string if no rates available
    if (!rates || !rates[currency]) {
      return "";
    }

    // Convert satoshis to BTC
    const btcAmount = sats / 100_000_000;

    // Get exchange rate
    const rate = rates[currency];

    // Calculate fiat amount
    const fiatAmount = btcAmount * rate.last;

    // Format the number with proper locale-specific decimal/thousand separators
    // Currency symbol will be displayed separately in the UI
    return fiatAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Format amount with symbol based on formatBalance preference
   * @param sats - Amount in satoshis
   * @returns Object with formatted amount and symbol
   */
  const formatAmount = (sats: number): IFormattedAmount => {
    // If formatBalance is false OR rates are unavailable, show satoshis
    if (!formatBalance || !rates || !rates[selectedCurrency]) {
      const formatted = formatInt(sats, "standard");
      const symbol = Math.abs(sats) === 1 ? "Sat" : "Sats";
      return { formatted, symbol };
    }

    // Otherwise show fiat currency
    const formatted = formatSatsAsCurrency(sats);
    const symbol = rates[selectedCurrency]?.symbol || selectedCurrency;
    return { formatted, symbol };
  };

  /**
   * Convert fiat currency amount to satoshis
   * @param fiatAmount - Amount in fiat currency
   * @param currencyCode - Optional currency code (defaults to selectedCurrency)
   * @returns Amount in satoshis (rounded to whole number)
   */
  const convertFiatToSats = (
    fiatAmount: number,
    currencyCode?: TCurrencyCode
  ): number => {
    // Use provided currency or fall back to selected currency
    const currency = currencyCode || selectedCurrency;

    // Return 0 if no rates available or invalid input
    if (!rates || !rates[currency] || !fiatAmount || fiatAmount <= 0) {
      return 0;
    }

    // Get exchange rate
    const rate = rates[currency];

    // Convert fiat to BTC
    const btcAmount = fiatAmount / rate.last;

    // Convert BTC to satoshis and round to whole number (no decimals in sats)
    const sats = Math.round(btcAmount * 100_000_000);

    return sats;
  };

  return {
    rates,
    selectedCurrency,
    setSelectedCurrency,
    isLoading,
    lastUpdate,
    error,
    refreshRates,
    formatSatsAsCurrency,
    formatBalance,
    setFormatBalance,
    formatAmount,
    convertFiatToSats,
  };
};

type UseCurrencyType = ReturnType<typeof useCurrency>;

const CurrencyContext = createContext<UseCurrencyType>({
  rates: null,
  selectedCurrency: DEFAULT_CURRENCY,
  setSelectedCurrency: async () => {},
  isLoading: true,
  lastUpdate: null,
  error: null,
  refreshRates: async () => {},
  formatSatsAsCurrency: () => "",
  formatBalance: false,
  setFormatBalance: async () => {},
  formatAmount: () => ({ formatted: "", symbol: "" }),
  convertFiatToSats: () => 0,
});

export const useCurrencyContext = () => useContext(CurrencyContext);

export const CurrencyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <CurrencyContext.Provider value={useCurrency()}>
    {children}
  </CurrencyContext.Provider>
);

// Export types for consumers
export type { ICurrencyContext };
