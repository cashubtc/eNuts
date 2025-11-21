export type LnAddressMetadata = {
  callback: string;
  minSendable?: number;
  maxSendable?: number;
};

export async function requestLnAddressMetadata(
  lnAdress: string
): Promise<LnAddressMetadata> {
  const [username, domain] = lnAdress.split("@");
  if (!username || !domain) {
    throw new Error("Invalid LN address");
  }
  const url = `https://${domain}/.well-known/lnurlp/${username}`;
  const response = await fetch(url);
  const data = (await response.json()) as LnAddressMetadata;
  return data;
}

export async function getInvoiceFromLnAddress(
  data: LnAddressMetadata,
  amountInMsats: number
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
