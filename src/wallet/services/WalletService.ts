import { CashuMint, CashuWallet, OutputData } from "@cashu/cashu-ts";
import { getSeed } from "@src/storage/store/restore";
import { getCounterByMintUrl } from "..";

class WalletService {
    async getWallet(mintUrl: string) {
        const seed = await getSeed();
        let counter = await getCounterByMintUrl(mintUrl);
        const wallet = new CashuWallet(new CashuMint(mintUrl), {
            bip39seed: seed,
            keepFactory: (a, k) => {
                if (!seed || !counter) {
                    return OutputData.createSingleRandomData(a, k.id);
                }
                const res = OutputData.createSingleDeterministicData(
                    a,
                    seed,
                    counter,
                    k.id
                );
                counter++;
                return res;
            },
        });
        return wallet;
    }
}

export const walletService = new WalletService();
