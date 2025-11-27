import { appLogger } from "@src/logger";
import type { IExchangeRates } from "@model";

const BLOCKCHAIN_INFO_API = "https://blockchain.info/ticker";

class ExchangeRateService {
  /**
   * Fetches current exchange rates from blockchain.info API
   * @returns Promise<IExchangeRates> - Object containing exchange rates for all currencies
   * @throws Error if the fetch fails or response is invalid
   */
  async fetchRates(): Promise<IExchangeRates> {
    try {
      appLogger.debug("ExchangeRateService: Fetching exchange rates from blockchain.info");
      
      const response = await fetch(BLOCKCHAIN_INFO_API, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rates: IExchangeRates = await response.json();
      
      appLogger.debug("ExchangeRateService: Successfully fetched exchange rates", {
        currencyCount: Object.keys(rates).length,
      });

      return rates;
    } catch (error) {
      appLogger.error("ExchangeRateService: Failed to fetch exchange rates", error);
      throw error;
    }
  }

  /**
   * Validates if the exchange rates object is valid
   * @param rates - Exchange rates object to validate
   * @returns boolean - True if valid, false otherwise
   */
  validateRates(rates: IExchangeRates): boolean {
    if (!rates || typeof rates !== "object") {
      return false;
    }

    // Check if at least one currency exists
    const currencies = Object.keys(rates);
    if (currencies.length === 0) {
      return false;
    }

    // Validate structure of first currency
    const firstCurrency = rates[currencies[0]];
    if (!firstCurrency) {
      return false;
    }

    // Check required fields
    const hasRequiredFields = 
      typeof firstCurrency.last === "number" &&
      typeof firstCurrency.buy === "number" &&
      typeof firstCurrency.sell === "number" &&
      typeof firstCurrency.symbol === "string";

    return hasRequiredFields;
  }
}

export const exchangeRateService = new ExchangeRateService();












