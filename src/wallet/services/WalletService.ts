import { CashuMint, CashuWallet } from "@cashu/cashu-ts";
import { getSeed } from "@src/storage/store/restore";

class WalletService {
    private wallets: Record<string, CashuWallet> = {};
    async getWallet(mintUrl: string) {
        if (this.wallets[mintUrl]) {
            return this.wallets[mintUrl];
        }
        const seed = await getSeed();
        const wallet = new CashuWallet(new CashuMint(mintUrl), {
            bip39seed: seed,
        });
        this.wallets[mintUrl] = wallet;
        return wallet;
    }
}

export const walletService = new WalletService();
