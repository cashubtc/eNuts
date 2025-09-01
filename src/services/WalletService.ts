import { CashuMint, CashuWallet, MintKeyset } from "@cashu/cashu-ts";
import { mintService } from "@src/services/MintService";
import { l } from "@src/logger";

interface CachedWallet {
  wallet: CashuWallet;
  lastCheck: number;
}

class WalletService {
  private walletCache: Map<string, CachedWallet> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  async getWallet(mintUrl: string): Promise<CashuWallet> {
    try {
      // Check cache first
      const cached = this.walletCache.get(mintUrl);
      const now = Date.now();

      if (cached && now - cached.lastCheck < this.CACHE_TTL) {
        l("[WalletService] Using cached wallet for", mintUrl);
        return cached.wallet;
      }

      // Ensure mint is known
      const isKnownMint = await mintService.isKnownMint(mintUrl);
      if (!isKnownMint) {
        throw new Error(`Mint ${mintUrl} is not known. Please add it first.`);
      }

      // Get fresh mint data and keysets
      const { mint, keysets } = await mintService.ensureFreshMintData(mintUrl);
      l(
        "[WalletService] Creating wallet with",
        keysets.length,
        "keysets for",
        mintUrl
      );

      console.log(keysets, mint);

      // Filter out keysets without keys (empty keypairs)
      const validKeysets = keysets.filter(
        (keyset) => keyset.keypairs && Object.keys(keyset.keypairs).length > 0
      );

      if (validKeysets.length === 0) {
        throw new Error(`No valid keysets found for mint ${mintUrl}`);
      }

      // Convert keysets to the format expected by CashuWallet
      const keys = validKeysets.map((keyset) => ({
        id: keyset.id,
        unit: "sat" as const,
        keys: keyset.keypairs,
      }));

      const compatibleKeysets: MintKeyset[] = validKeysets.map((k) => ({
        id: k.id,
        unit: "sat" as const,
        active: k.active,
        input_fee_ppk: k.feePpk,
      }));

      const wallet = new CashuWallet(new CashuMint(mintUrl), {
        mintInfo: mint.mintInfo,
        keys,
        keysets: compatibleKeysets,
      });

      // Cache the wallet
      this.walletCache.set(mintUrl, {
        wallet,
        lastCheck: now,
      });

      l("[WalletService] Successfully created and cached wallet for", mintUrl);
      return wallet;
    } catch (error) {
      l("[WalletService] Failed to create wallet for", mintUrl, ":", error);
      throw error;
    }
  }

  /**
   * Clear cached wallet for a specific mint URL
   */
  clearCache(mintUrl: string): void {
    this.walletCache.delete(mintUrl);
    l("[WalletService] Cleared cache for", mintUrl);
  }

  /**
   * Clear all cached wallets
   */
  clearAllCaches(): void {
    this.walletCache.clear();
    l("[WalletService] Cleared all wallet caches");
  }

  /**
   * Force refresh mint data and get fresh wallet
   */
  async refreshWallet(mintUrl: string): Promise<CashuWallet> {
    this.clearCache(mintUrl);
    await mintService.updateMintData(mintUrl);
    return this.getWallet(mintUrl);
  }
}

export const walletService = new WalletService();
