import { walletService } from "./WalletService";
import { mintRepository, KnownMint } from "@src/storage/db/repo/MintRepository";
import { MintInfo } from "../types";
import { knownMintsEvents } from "@src/util/events";

class MintService {
    async getKnownMintInfo(mintUrl: string): Promise<MintInfo> {
        const mint = await mintRepository.getKnownMint(mintUrl);
        if (!mint) {
            throw new Error("Mint not found");
        }
        return mint.mintInfo;
    }

    async isKnownMint(mintUrl: string): Promise<boolean> {
        const mint = await mintRepository.getKnownMint(mintUrl);
        return !!mint;
    }

    async updateAllKnownMints(): Promise<void> {
        const mints = await mintRepository.getAllKnownMints();
        for (const mint of mints) {
            const wallet = await walletService.getWallet(mint.mintUrl);
            const mintInfo = await wallet.getMintInfo();
            await mintRepository.saveKnownMint(mint.mintUrl, mintInfo);
        }
        knownMintsEvents.emit("knownMintsUpdated", null);
    }

    async getAllKnownMints(): Promise<KnownMint[]> {
        return await mintRepository.getAllKnownMints();
    }

    async removeMintFromKnownMints(mintUrl: string): Promise<boolean> {
        const success = await mintRepository.deleteKnownMint(mintUrl);
        if (success) {
            knownMintsEvents.emit("knownMintsUpdated", null);
        }
        return success;
    }

    async updateKnownMint(
        mintUrl: string,
        updates: Partial<KnownMint>
    ): Promise<boolean> {
        const success = await mintRepository.updateKnownMint(mintUrl, updates);
        if (success) {
            knownMintsEvents.emit("knownMintsUpdated", null);
        }
        return success;
    }

    async findKnownMintsByName(namePattern: string): Promise<KnownMint[]> {
        return await mintRepository.findKnownMintsByName(namePattern);
    }

    async getKnownMintsCount(): Promise<number> {
        return await mintRepository.getKnownMintsCount();
    }

    async getUnknownMintInfo(mintUrl: string): Promise<MintInfo> {
        const wallet = await walletService.getWallet(mintUrl);
        const mintInfo = await wallet.getMintInfo();
        return mintInfo;
    }

    async addKnownMint(mintUrl: string): Promise<boolean> {
        const mintInfo = await this.getUnknownMintInfo(mintUrl);
        const success = await mintRepository.saveKnownMint(mintUrl, mintInfo);
        if (success) {
            knownMintsEvents.emit("knownMintsUpdated", null);
        }
        return success;
    }
}

export const mintService = new MintService();
