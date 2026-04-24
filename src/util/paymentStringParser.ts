import { decodePaymentRequest, getDecodedToken } from "@cashu/cashu-ts";

import { isLightningAddress, isLnurl } from "./lnurl";

export type PaymentCandidateKind =
  | "cashuToken"
  | "lightningInvoice"
  | "lightningAddress"
  | "lnurl"
  | "cashuPaymentRequest"
  | "bitcoinAddress";

export type PaymentCandidateSource = "direct" | "uri" | "bitcoin-uri-body" | "bitcoin-uri-param";

interface IPaymentCandidateBase {
  kind: PaymentCandidateKind;
  value: string;
  raw: string;
  source: PaymentCandidateSource;
  param?: string;
  required?: boolean;
  supported: boolean;
}

export interface ICashuTokenCandidate extends IPaymentCandidateBase {
  kind: "cashuToken";
  supported: true;
}

export interface ILightningInvoiceCandidate extends IPaymentCandidateBase {
  kind: "lightningInvoice";
  supported: true;
}

export interface ILightningAddressCandidate extends IPaymentCandidateBase {
  kind: "lightningAddress";
  supported: true;
}

export interface ILnurlCandidate extends IPaymentCandidateBase {
  kind: "lnurl";
  supported: true;
}

export interface ICashuPaymentRequestCandidate extends IPaymentCandidateBase {
  kind: "cashuPaymentRequest";
  supported: true;
}

export interface IBitcoinAddressCandidate extends IPaymentCandidateBase {
  kind: "bitcoinAddress";
  supported: false;
}

export type PaymentStringCandidate =
  | ICashuTokenCandidate
  | ILightningInvoiceCandidate
  | ILightningAddressCandidate
  | ILnurlCandidate
  | ICashuPaymentRequestCandidate
  | IBitcoinAddressCandidate;

const CASHU_TOKEN_URI_PREFIXES = [
  "https://wallet.nutstash.app/#",
  "https://wallet.cashu.me/?token=",
  "web+cashu://",
  "cashu://",
  "cashu:",
];

const LIGHTNING_PREFIXES = ["lightning://", "lightning:", "lightning="];

const LNURL_WRAPPER_PREFIXES = ["lnurl://", "lnurl=", "lnurl:"];

const CASHU_REQUEST_PARAM_KEYS = new Set([
  "cashu",
  "cashu_pr",
  "cashu_request",
  "cashupaymentrequest",
  "cashu_payment_request",
  "creq",
  "paymentrequest",
  "payment_request",
]);

const CASHU_TOKEN_PARAM_KEYS = new Set(["cashu_token", "cashutoken", "token"]);

const BITCOIN_ADDRESS_PARAM_KEYS = new Set(["bc", "tb", "bcrt"]);

function stripPrefix(value: string, prefixes: string[]) {
  const lower = value.toLowerCase();
  const prefix = prefixes.find((p) => lower.startsWith(p));
  return prefix ? value.slice(prefix.length).trim() : value;
}

function stripCashuTokenUri(value: string) {
  let normalized = value.trim();
  const idx = normalized.indexOf("cashuA");
  if (idx !== -1) {
    normalized = normalized.slice(idx);
  }
  return stripPrefix(normalized, CASHU_TOKEN_URI_PREFIXES);
}

function stripLightningUri(value: string) {
  return stripPrefix(value.trim(), LIGHTNING_PREFIXES);
}

function isCashuTokenValue(value: string) {
  try {
    getDecodedToken(value);
    return true;
  } catch {
    return false;
  }
}

function isCashuPaymentRequestValue(value: string) {
  try {
    decodePaymentRequest(value);
    return true;
  } catch {
    return false;
  }
}

function isLightningInvoiceValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("lnbc") ||
    normalized.startsWith("lntb") ||
    normalized.startsWith("lnbcrt") ||
    normalized.startsWith("lnsb") ||
    normalized.startsWith("lntbs")
  );
}

function isBitcoinAddressValue(value: string) {
  const normalized = value.trim();
  return (
    /^(bc1|tb1|bcrt1)[023456789acdefghjklmnpqrstuvwxyz]{10,}$/i.test(normalized) ||
    /^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,}$/.test(normalized)
  );
}

function decodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function addCandidate(candidates: PaymentStringCandidate[], candidate: PaymentStringCandidate) {
  const exists = candidates.some(
    (item) =>
      item.kind === candidate.kind &&
      item.value === candidate.value &&
      item.param === candidate.param &&
      item.source === candidate.source,
  );

  if (!exists) {
    candidates.push(candidate);
  }
}

function parseStandalonePaymentString(
  input: string,
  source: PaymentCandidateSource,
  raw: string,
  param?: string,
  required?: boolean,
) {
  const candidates: PaymentStringCandidate[] = [];
  const trimmed = input.trim();

  if (!trimmed) {
    return candidates;
  }

  const cashuPaymentRequest = stripPrefix(
    stripPrefix(trimmed, ["cashu-request://", "cashu-request:"]),
    CASHU_TOKEN_URI_PREFIXES,
  );
  if (isCashuPaymentRequestValue(cashuPaymentRequest)) {
    addCandidate(candidates, {
      kind: "cashuPaymentRequest",
      value: cashuPaymentRequest,
      raw,
      source,
      param,
      required,
      supported: true,
    });
  }

  const cashuToken = stripCashuTokenUri(trimmed);
  if (isCashuTokenValue(cashuToken)) {
    addCandidate(candidates, {
      kind: "cashuToken",
      value: cashuToken,
      raw,
      source,
      param,
      required,
      supported: true,
    });
  }

  const lightningValue = stripLightningUri(trimmed);
  if (isLightningInvoiceValue(lightningValue)) {
    addCandidate(candidates, {
      kind: "lightningInvoice",
      value: lightningValue,
      raw,
      source,
      param,
      required,
      supported: true,
    });
  }

  const lnurlValue = isLnurl(lightningValue)
    ? lightningValue
    : stripPrefix(lightningValue, LNURL_WRAPPER_PREFIXES);
  if (isLnurl(lnurlValue)) {
    addCandidate(candidates, {
      kind: "lnurl",
      value: lnurlValue,
      raw,
      source,
      param,
      required,
      supported: true,
    });
  }

  if (isLightningAddress(lightningValue)) {
    addCandidate(candidates, {
      kind: "lightningAddress",
      value: lightningValue,
      raw,
      source,
      param,
      required,
      supported: true,
    });
  }

  if (isBitcoinAddressValue(trimmed)) {
    addCandidate(candidates, {
      kind: "bitcoinAddress",
      value: trimmed,
      raw,
      source,
      param,
      required,
      supported: false,
    });
  }

  return candidates;
}

function parseBitcoinUri(input: string) {
  const candidates: PaymentStringCandidate[] = [];
  const raw = input.trim();
  const body = raw.slice(raw.indexOf(":") + 1);
  const [addressPart = "", query = ""] = body.split("?");
  const address = decodeUriComponent(addressPart.replace(/^\/\//, "")).trim();

  if (address && isBitcoinAddressValue(address)) {
    addCandidate(candidates, {
      kind: "bitcoinAddress",
      value: address,
      raw,
      source: "bitcoin-uri-body",
      supported: false,
    });
  }

  const params = new URLSearchParams(query);

  params.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    const isRequired = normalizedKey.startsWith("req-");
    const unprefixedKey = isRequired ? normalizedKey.slice(4) : normalizedKey;

    if (unprefixedKey === "lightning") {
      parseStandalonePaymentString(value, "bitcoin-uri-param", raw, key, isRequired).forEach(
        (candidate) => addCandidate(candidates, candidate),
      );
      return;
    }

    if (unprefixedKey === "lnurl" || unprefixedKey === "lnurlp") {
      parseStandalonePaymentString(value, "bitcoin-uri-param", raw, key, isRequired).forEach(
        (candidate) => addCandidate(candidates, candidate),
      );
      return;
    }

    if (CASHU_REQUEST_PARAM_KEYS.has(unprefixedKey) || CASHU_TOKEN_PARAM_KEYS.has(unprefixedKey)) {
      parseStandalonePaymentString(value, "bitcoin-uri-param", raw, key, isRequired).forEach(
        (candidate) => addCandidate(candidates, candidate),
      );
      return;
    }

    if (BITCOIN_ADDRESS_PARAM_KEYS.has(unprefixedKey) && isBitcoinAddressValue(value)) {
      addCandidate(candidates, {
        kind: "bitcoinAddress",
        value,
        raw,
        source: "bitcoin-uri-param",
        param: key,
        required: isRequired,
        supported: false,
      });
    }
  });

  return candidates;
}

export function parsePaymentString(input: string): PaymentStringCandidate[] {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.toLowerCase().startsWith("bitcoin:")) {
    return parseBitcoinUri(trimmed);
  }

  return parseStandalonePaymentString(trimmed, trimmed.includes(":") ? "uri" : "direct", trimmed);
}
