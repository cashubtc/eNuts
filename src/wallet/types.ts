import { CashuWallet } from "@cashu/cashu-ts";

export type MintInfo = Awaited<ReturnType<CashuWallet["getMintInfo"]>>;
