import { useMemo } from "react";
import { Mint } from "coco-cashu-core";
import { useMints, useBalanceContext } from "coco-cashu-react";

export type KnownMintWithBalance = Mint & { balance: number };

export const useKnownMints = () => {
  const { trustedMints } = useMints();
  const { balance } = useBalanceContext();

  const knownMints: KnownMintWithBalance[] = useMemo(
    () =>
      trustedMints.map((mint) => ({
        ...mint,
        balance: balance[mint.mintUrl] || 0,
      })),
    [trustedMints, balance]
  );

  return { knownMints, loading: false };
};
