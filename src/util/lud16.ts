import { decodeUrlOrAddress } from "@util/lnurl";

export type LnAddressMetadata = {
  callback: string;
  minSendable?: number;
  maxSendable?: number;
};

export async function requestLnurlPayMetadata(lnUrlOrAddress: string): Promise<LnAddressMetadata> {
  const url = decodeUrlOrAddress(lnUrlOrAddress);
  if (!url) {
    throw new Error("Invalid LNURL or Lightning address");
  }
  const response = await fetch(url);
  const data = (await response.json()) as LnAddressMetadata;
  if (!data.callback) {
    throw new Error("No invoice callback found");
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
