import { getDecodedToken, Token } from "@cashu/cashu-ts";
import { useReceiveOperation } from "@cashu/coco-react";
import { usePromptContext } from "@src/context/Prompt";
import { useManager } from "@src/context/Manager";
import { NS } from "@src/i18n";
import { useTrustMint } from "@modal/TrustMintProvider";
import { isErr } from "@src/util";
import { useTranslation } from "react-i18next";

export type ClaimResult = SuccessClaimResult | CancelledClaimResult | ErrorClaimResult;
type SuccessClaimResult = {
  token: Token;
  amount: number;
  status: "success";
};
type CancelledClaimResult = {
  status: "cancelled";
};
type ErrorClaimResult = {
  status: "error";
  error: string;
};

export function useCashuClaimFlow() {
  const { t } = useTranslation([NS.common, NS.error, NS.wallet]);
  const { openPromptAutoClose } = usePromptContext();
  const manager = useManager();
  const { open: openTrustMint } = useTrustMint();
  const { prepare, execute, isLoading: isReceiving } = useReceiveOperation();

  const claimFromTokenString = async (tokenStr: string): Promise<ClaimResult> => {
    try {
      const decoded = getDecodedToken(tokenStr);
      const amount = decoded.proofs.reduce(
        (acc: number, proof: { amount: number }) => acc + proof.amount,
        0,
      );
      const isKnown = await manager.mint.isTrustedMint(decoded.mint);
      if (isKnown) {
        await prepare({ token: decoded });
        await execute();
        return {
          status: "success",
          token: decoded,
          amount,
        };
      }

      const action = await openTrustMint(decoded);
      if (action === "trust") {
        await manager.mint.addMint(decoded.mint, { trusted: true });
        await manager.wallet.receive(decoded);
        return { status: "success", token: decoded, amount };
      }
      // If cancelled or any other action, just abort as per requirement
      return { status: "cancelled" };
    } catch (e) {
      console.error(e);
      openPromptAutoClose({
        msg: isErr(e) ? e.message : t("claimTokenErr", { ns: NS.error }),
      });
      return {
        status: "error",
        error: isErr(e) ? e.message : "Something went wrong",
      };
    }
  };

  return { claimFromTokenString, isReceiving };
}
