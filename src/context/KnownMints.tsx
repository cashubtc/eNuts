import { useMemo } from "react";
import { Mint } from "@cashu/coco-core";
import { useMints, useBalanceContext } from "@cashu/coco-react";

export type KnownMintWithBalance = Mint & { balance: number };

export const useKnownMints = () => {
  const { trustedMints } = useMints();
  const { balances } = useBalanceContext();

  const knownMints: KnownMintWithBalance[] = useMemo(
    () =>
      trustedMints.map((mint) => ({
        ...mint,
        balance: balances.byMint[mint.mintUrl]?.total || 0,
      })),
    [trustedMints, balances],
  );

  return { knownMints, loading: false };
};
