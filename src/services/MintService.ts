// Note: Removed walletService import to avoid circular dependency
import { mintRepository, Mint } from "@src/storage/db/repo/MintRepository";
import {
  keysetRepository,
  type Keyset,
} from "@src/storage/db/repo/KeysetsRepository";
import { MintInfo } from "@src/wallet/types";
import { knownMintsEvents } from "@src/util/events";
import { CashuMint, deriveKeysetId, MintKeys } from "@cashu/cashu-ts";
import { l } from "@src/logger";

class MintService {
  async getStoredMintInfo(mintUrl: string): Promise<MintInfo> {
    const mint = await mintRepository.getMint(mintUrl);
    if (!mint) {
      throw new Error("Mint not found");
    }
    return mint.mintInfo;
  }

  async isKnownMint(mintUrl: string): Promise<boolean> {
    const mint = await mintRepository.getMint(mintUrl);
    return !!mint;
  }

  async updateAllMintsInfo(): Promise<void> {
    const mints = await mintRepository.getAllMints();
    for (const mint of mints) {
      await this.updateMintData(mint.mintUrl);
    }
    knownMintsEvents.emit("knownMintsUpdated", null);
  }

  async getAllMints(): Promise<Mint[]> {
    return await mintRepository.getAllMints();
  }

  async removeMintFromStrore(mintUrl: string): Promise<boolean> {
    const success = await mintRepository.deleteMint(mintUrl);
    if (success) {
      knownMintsEvents.emit("knownMintsUpdated", null);
    }
    return success;
  }

  async updateMint(mintUrl: string, updates: Partial<Mint>): Promise<boolean> {
    const success = await mintRepository.updateMint(mintUrl, updates);
    if (success) {
      knownMintsEvents.emit("knownMintsUpdated", null);
    }
    return success;
  }

  async findMintsByName(namePattern: string): Promise<Mint[]> {
    return await mintRepository.findMintsByName(namePattern);
  }

  async getMintsCount(): Promise<number> {
    return await mintRepository.getMintsCount();
  }

  async getUnknownMintInfo(mintUrl: string): Promise<MintInfo> {
    const mint = new CashuMint(mintUrl);
    const mintInfo = await mint.getInfo();
    return mintInfo;
  }

  async addMint(mintUrl: string): Promise<boolean> {
    try {
      // Check if mint already exists
      const existingMint = await mintRepository.getMint(mintUrl);
      if (existingMint) {
        l("[MintService] Mint already exists", mintUrl);
        return false;
      }

      // Add new mint with fresh data
      await this.createMintData(mintUrl);
      l("[MintService] Mint added", mintUrl);
      knownMintsEvents.emit("knownMintsUpdated", null);
      return true;
    } catch (e) {
      l("[MintService] Failed to add mint", mintUrl, e);
      return false;
    }
  }

  /**
   * Creates new mint data and keysets for a given mint URL
   * This is used when adding a completely new mint
   */
  async createMintData(mintUrl: string): Promise<void> {
    try {
      l("[MintService] Creating mint data for", mintUrl);

      const mint = new CashuMint(mintUrl);

      // Get and save mint info
      const mintInfo = await mint.getInfo();
      const mintSaved = await mintRepository.saveMint(mintUrl, mintInfo);
      if (!mintSaved) {
        throw new Error("Failed to save mint - it may already exist");
      }
      l("[MintService] Created mint info for", mintUrl);

      // Get and save keysets
      const keysetReq = await mint.getKeySets();

      for (const keyset of keysetReq.keysets) {
        if (keyset.unit !== "sat") {
          continue;
        }
        const keys = await mint.getKeys(keyset.id);
        if (keys.keysets.length === 0 || keys.keysets.length > 1) {
          throw new Error("Invalid keysets for mint");
        }
        const retrievedKeys = keys.keysets[0].keys;
        const keysetSaved = await keysetRepository.saveKeyset({
          mintUrl,
          id: keyset.id,
          keypairs: retrievedKeys,
          active: keyset.active,
          counter: 0, // New keysets start with counter 0
          feePpk: keyset.input_fee_ppk || 0,
        });
        if (!keysetSaved) {
          l("[MintService] Warning: Keyset already exists", keyset.id);
        }
      }

      l("[MintService] Successfully created mint data for", mintUrl);
    } catch (error) {
      l("[MintService] Failed to create mint data for", mintUrl, error);
      throw error;
    }
  }

  /**
   * Updates mint info and all keysets for a given mint URL
   * This ensures both mint data and keysets are synchronized while preserving counters
   */
  async updateMintData(mintUrl: string): Promise<void> {
    try {
      l("[MintService] Updating mint data for", mintUrl);

      const mint = new CashuMint(mintUrl);

      // Update mint info
      const mintInfo = await mint.getInfo();
      const mintUpdated = await mintRepository.updateMint(mintUrl, {
        mintInfo,
        name: mintInfo.name || "Unknown Mint",
      });
      if (!mintUpdated) {
        throw new Error("Failed to update mint - it may not exist");
      }
      l("[MintService] Updated mint info for", mintUrl);

      // Update keysets while preserving counters
      const keysetReq = await mint.getKeySets();

      for (const keyset of keysetReq.keysets) {
        if (keyset.unit !== "sat") {
          continue;
        }
        const keys = await mint.getKeys(keyset.id);
        if (keys.keysets.length === 0 || keys.keysets.length > 1) {
          throw new Error("Invalid keysets for mint");
        }
        const retrievedKeys = keys.keysets[0].keys;
        await keysetRepository.upsertKeysetPreservingCounter({
          mintUrl,
          id: keyset.id,
          keypairs: retrievedKeys,
          active: keyset.active,
          counter: 0, // This will only be used for new keysets
          feePpk: keyset.input_fee_ppk || 0,
        });
      }

      l("[MintService] Successfully updated mint data for", mintUrl);
    } catch (error) {
      l("[MintService] Failed to update mint data for", mintUrl, error);
      throw error;
    }
  }

  /**
   * Checks if mint data needs updating (older than 5 minutes)
   */
  async shouldUpdateMintData(mintUrl: string): Promise<boolean> {
    const mint = await mintRepository.getMint(mintUrl);
    if (!mint) {
      return true; // Mint not found, needs to be added
    }

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const mintLastUpdated = mint.updatedAt * 1000; // Convert to milliseconds

    return mintLastUpdated < fiveMinutesAgo;
  }

  /**
   * Ensures mint data is fresh (updates if needed) and returns mint info
   */
  async ensureFreshMintData(
    mintUrl: string
  ): Promise<{ mint: Mint; keysets: Keyset[] }> {
    if (await this.shouldUpdateMintData(mintUrl)) {
      l("[MintService] Mint data is stale, updating...", mintUrl);
      await this.updateMintData(mintUrl);
    }

    const mint = await mintRepository.getMint(mintUrl);
    if (!mint) {
      throw new Error(`Failed to get mint data for ${mintUrl}`);
    }

    const keysets = await keysetRepository.getKeysetsByMintUrl(mintUrl);

    return { mint, keysets };
  }
}

export const mintService = new MintService();
