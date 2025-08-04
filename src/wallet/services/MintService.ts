import { walletService } from "./WalletService";
import { mintRepository, Mint } from "@src/storage/db/repo/MintRepository";
import { MintInfo } from "../types";
import { knownMintsEvents } from "@src/util/events";

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
            const wallet = await walletService.getWallet(mint.mintUrl);
            const mintInfo = await wallet.getMintInfo();
            await mintRepository.saveKnownMint(mint.mintUrl, mintInfo);
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

    async updateMint(
        mintUrl: string,
        updates: Partial<Mint>
    ): Promise<boolean> {
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
        const wallet = await walletService.getWallet(mintUrl);
        const mintInfo = await wallet.getMintInfo();
        return mintInfo;
    }

    async addMint(mintUrl: string): Promise<boolean> {
        const mintInfo = await this.getUnknownMintInfo(mintUrl);
        const success = await mintRepository.saveKnownMint(mintUrl, mintInfo);
        if (success) {
            knownMintsEvents.emit("knownMintsUpdated", null);
        }
        return success;
    }
}

export const mintService = new MintService();
