import { decodeUrlOrAddress } from "@util/lnurl";

export type LnAddressMetadata = {
  tag: "payRequest";
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
};

function isLnurlPayMetadata(data: unknown): data is LnAddressMetadata {
  if (!data || typeof data !== "object") {
    return false;
  }

  const metadata = data as Partial<LnAddressMetadata>;
  return (
    metadata.tag === "payRequest" &&
    typeof metadata.callback === "string" &&
    metadata.callback.length > 0 &&
    typeof metadata.minSendable === "number" &&
    typeof metadata.maxSendable === "number" &&
    typeof metadata.metadata === "string"
  );
}

export async function requestLnurlPayMetadata(lnUrlOrAddress: string): Promise<LnAddressMetadata> {
  const url = decodeUrlOrAddress(lnUrlOrAddress);
  if (!url) {
    throw new Error("Invalid LNURL or Lightning address");
  }
  const response = await fetch(url);
  const data = (await response.json()) as unknown;
  if (!isLnurlPayMetadata(data)) {
    throw new Error("Invalid LNURL pay request");
  }
  return data;
}

export async function getInvoiceFromLnAddress(
  data: LnAddressMetadata,
  amountInMsats: number,
): Promise<string> {
  if (!data.callback) {
    throw new Error("Callback URL is required");
  }
  const res = await fetch(`${data.callback}?amount=${amountInMsats}`);
  const { pr } = (await res.json()) as { pr: string };
  if (!pr) {
    throw new Error("No invoice found");
  }
  return pr;
}
