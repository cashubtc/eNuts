import { CashuMint, CashuWallet } from "@cashu/cashu-ts";
import { MintInfo } from "@src/wallet/types";

export type MintData = {
    mintUrl: string;
    info: MintInfo;
};
