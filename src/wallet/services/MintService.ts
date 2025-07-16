import { walletService } from "./WalletService";
import { mintRepository } from "@src/storage/db/MintRepository";
import { MintInfo } from "../types";

class MintService {
    async getKnownMintInfo(mintUrl: string): Promise<MintInfo> {
        const mint = await mintRepository.getKnownMint(mintUrl);
        if (!mint) {
            throw new Error("Mint not found");
        }
        return mint.mint_info;
    }

    async updateAllKnownMints() {
        const mints = await mintRepository.getAllKnownMints();
        for (const mint of mints) {
            const wallet = await walletService.getWallet(mint.mint_url);
            const mintInfo = await wallet.getMintInfo();
            await mintRepository.saveKnownMint(mint.mint_url, mintInfo);
        }
    }

    async getAllKnownMints() {
        return await mintRepository.getAllKnownMints();
    }

    async removeMintFromKnownMints(mintUrl: string) {
        return await mintRepository.deleteKnownMint(mintUrl);
    }
}

export const mintService = new MintService();
