import { CashuMint } from "@cashu/cashu-ts";

export type MintInfo = Awaited<ReturnType<CashuMint["getInfo"]>>;
