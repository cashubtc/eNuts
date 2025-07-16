import { walletService } from "./WalletService";
import { mintRepository, KnownMint } from "@src/storage/db/MintRepository";
import { MintInfo } from "../types";

class MintService {
    async getKnownMintInfo(mintUrl: string): Promise<MintInfo> {
        const mint = await mintRepository.getKnownMint(mintUrl);
        if (!mint) {
            throw new Error("Mint not found");
        }
        return mint.mintInfo;
    }

    async updateAllKnownMints(): Promise<void> {
        const mints = await mintRepository.getAllKnownMints();
        for (const mint of mints) {
            const wallet = await walletService.getWallet(mint.mintUrl);
            const mintInfo = await wallet.getMintInfo();
            await mintRepository.saveKnownMint(mint.mintUrl, mintInfo);
        }
    }

    async getAllKnownMints(): Promise<KnownMint[]> {
        return await mintRepository.getAllKnownMints();
    }

    async removeMintFromKnownMints(mintUrl: string): Promise<boolean> {
        return await mintRepository.deleteKnownMint(mintUrl);
    }

    async updateKnownMint(
        mintUrl: string,
        updates: Partial<KnownMint>
    ): Promise<boolean> {
        return await mintRepository.updateKnownMint(mintUrl, updates);
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
}

export const mintService = new MintService();
