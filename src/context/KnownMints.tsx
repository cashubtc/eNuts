import { useMemo } from "react";
import { Mint } from "coco-cashu-core";
import { useMints, useBalanceContext } from "coco-cashu-react";

export type KnownMintWithBalance = Mint & { balance: number };

export const useKnownMints = () => {
  const { mints } = useMints();
  const { balance } = useBalanceContext();

  const knownMints: KnownMintWithBalance[] = useMemo(
    () =>
      mints
        .filter((mint) => mint.trusted)
        .map((mint) => ({ ...mint, balance: balance[mint.mintUrl] || 0 })),
    [mints, balance]
  );

  return { knownMints, loading: false };
};
