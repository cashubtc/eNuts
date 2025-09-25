import { getDecodedToken, Token } from "@cashu/cashu-ts";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { useTranslation } from "react-i18next";
import { useManager } from "@src/context/Manager";
import { useTrustMint } from "@modal/TrustMintProvider";
import { isErr } from "@src/util";
import { useReceive, useSend } from "coco-cashu-react";

export type ClaimResult = "success" | "cancelled" | "error";

export function useCashuClaimFlow() {
  const { t } = useTranslation([NS.common, NS.error, NS.wallet]);
  const { openPromptAutoClose } = usePromptContext();
  const manager = useManager();
  const { open: openTrustMint } = useTrustMint();
  const { receive, isReceiving, isError: isReceiveError } = useReceive();

  const claimFromTokenString = async (
    tokenStr: string
  ): Promise<ClaimResult> => {
    let decoded: Token;

    try {
      const decoded = getDecodedToken(tokenStr);
      const isKnown = await manager.mint.isKnownMint(decoded.mint);
      if (isKnown) {
        await receive(decoded, {
          onError: (e) => {
            console.error(e);
            openPromptAutoClose({
              msg: isErr(e)
                ? e.message
                : t("receiveTokenErr", { ns: NS.error }),
            });
            return "error";
          },
        });
        return "success";
      }

      const action = await openTrustMint(decoded);
      if (action === "trust") {
        await manager.mint.addMint(decoded.mint);
        await manager.wallet.receive(decoded);
        return "success";
      }
      // If cancelled or any other action, just abort as per requirement
      return "cancelled";
    } catch (e) {
      console.error(e);
      openPromptAutoClose({
        msg: isErr(e) ? e.message : t("Something went wrong"),
      });
      return "error";
    }
  };

  return { claimFromTokenString, isReceiving };
}
