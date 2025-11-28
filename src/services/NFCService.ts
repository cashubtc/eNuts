// NfcCashuPayment.ts
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { Buffer } from "buffer/";
import { appLogger } from "@src/logger";

const log = appLogger.child({ name: "NFC" });

// ---------- CONSTANTS FROM SPEC ----------
const SELECT_AID = [
  0x00, 0xa4, 0x04, 0x00, 0x07, 0xd2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00,
];

const SELECT_NDEF = [0x00, 0xa4, 0x00, 0x0c, 0x02, 0xe1, 0x04];

const READ_BINARY = (offset: number, len: number) => [
  0x00,
  0xb0,
  (offset >> 8) & 0xff,
  offset & 0xff,
  len,
];

const UPDATE_BINARY = (offset: number, bytes: number[]) => [
  0x00,
  0xd6,
  (offset >> 8) & 0xff,
  offset & 0xff,
  bytes.length,
  ...bytes,
];

const STATUS_OK = "9000";

// Status word meanings for better error messages
const STATUS_CODES: Record<string, string> = {
  "9000": "Success",
  "6a82": "File not found / Not supported",
  "6a86": "Incorrect P1-P2 parameters",
  "6a87": "Lc inconsistent with TLV structure",
  "6700": "Wrong length",
  "6982": "Security status not satisfied",
  "6985": "Conditions of use not satisfied",
  "6d00": "INS not supported",
  "6e00": "CLA not supported",
};

// ------------------------------------------

function hex(bytes: number[]): string {
  return Buffer.from(bytes).toString("hex").toUpperCase();
}

function toBytes(str: string): number[] {
  return Array.from(Buffer.from(str, "utf8"));
}

function getStatusMessage(sw: string): string {
  const swLower = sw.toLowerCase();
  return STATUS_CODES[swLower] || `Unknown status: ${sw}`;
}

// Build an NDEF Text record (supports both Short Record and Normal Record)
function buildTextNdef(text: string): number[] {
  const lang = "en";
  const langBytes = toBytes(lang);
  const textBytes = toBytes(text);

  const payload = [
    langBytes.length, // status byte (bit 7=0 for UTF-8, lower 6 bits = lang length)
    ...langBytes,
    ...textBytes,
  ];

  let recordHeader: number[];

  if (payload.length <= 255) {
    // Short Record format (SR=1)
    log.debug(`Building Short Record NDEF (payload: ${payload.length} bytes)`);
    recordHeader = [
      0xd1, // MB=1, ME=1, SR=1, TNF=1
      0x01, // type length
      payload.length, // payload length (1 byte)
      0x54, // 'T'
      ...payload,
    ];
  } else {
    // Normal Record format (SR=0) for payloads > 255 bytes
    log.debug(`Building Normal Record NDEF (payload: ${payload.length} bytes)`);
    const len = payload.length;
    recordHeader = [
      0xc1, // MB=1, ME=1, SR=0, TNF=1
      0x01, // type length
      (len >> 24) & 0xff, // payload length (4 bytes, big-endian)
      (len >> 16) & 0xff,
      (len >> 8) & 0xff,
      len & 0xff,
      0x54, // 'T'
      ...payload,
    ];
  }

  const nlen = recordHeader.length;
  log.debug(`NDEF message total size: ${nlen + 2} bytes (NLEN=${nlen})`);
  return [(nlen >> 8) & 0xff, nlen & 0xff, ...recordHeader];
}

interface ApduResponse {
  ok: boolean;
  raw: number[];
  payload: number[];
  sw: string;
}

async function sendApdu(
  command: number[],
  label?: string
): Promise<ApduResponse> {
  const cmdHex = hex(command);
  log.debug(`>> APDU${label ? ` [${label}]` : ""}: ${cmdHex}`);

  try {
    const response = await NfcManager.isoDepHandler.transceive(command);
    const hexResp = hex(response);
    const sw = hexResp.slice(-4);
    const ok = sw.toLowerCase() === STATUS_OK.toLowerCase();

    log.debug(`<< Response: ${hexResp} (SW: ${sw} - ${getStatusMessage(sw)})`);

    return {
      ok,
      raw: response,
      payload: response.slice(0, -2), // strip SW1 SW2
      sw,
    };
  } catch (error) {
    log.error(`APDU transceive failed:`, error);
    throw new NfcError(
      `APDU communication failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "TRANSCEIVE_FAILED"
    );
  }
}

// Custom error class for NFC operations
export class NfcError extends Error {
  code: string;
  sw?: string;

  constructor(message: string, code: string, sw?: string) {
    super(message);
    this.name = "NfcError";
    this.code = code;
    this.sw = sw;
  }
}

// ------------------ MAIN API ------------------

/**
 * Result of reading a payment request
 */
export interface PaymentRequestResult {
  /** The raw payment request string (e.g., "creqA...") */
  request: string;
}

/**
 * Callback to create a token from the payment request.
 * Return the Cashu token string to write back to the PoS.
 */
export type TokenCreator = (request: string) => Promise<string>;

export default class NfcCashuPayment {
  /**
   * Check if NFC is supported and enabled on this device
   */
  static async isSupported(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      log.debug(`NFC supported: ${supported}`);
      return supported;
    } catch (error) {
      log.warn("Failed to check NFC support:", error);
      return false;
    }
  }

  /**
   * Check if NFC is currently enabled
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const enabled = await NfcManager.isEnabled();
      log.debug(`NFC enabled: ${enabled}`);
      return enabled;
    } catch (error) {
      log.warn("Failed to check if NFC is enabled:", error);
      return false;
    }
  }

  /**
   * Perform a complete NFC Cashu payment flow:
   * 1. Connect to the PoS terminal
   * 2. Read the payment request
   * 3. Call your callback to create a token
   * 4. Write the token back to the PoS
   * 5. Close the connection
   *
   * This keeps the NFC session open throughout the entire flow.
   *
   * @param createToken Async callback that receives the payment request and returns a Cashu token
   * @returns The payment request that was read
   *
   * @example
   * ```typescript
   * await NfcCashuPayment.performPayment(async (paymentRequest) => {
   *   const pr = PaymentRequest.fromEncodedRequest(paymentRequest);
   *   const token = await manager.wallet.send(pr.mints![0]!, pr.amount!);
   *   return getEncodedToken(token);
   * });
   * ```
   */
  static async performPayment(
    createToken: TokenCreator
  ): Promise<PaymentRequestResult> {
    log.info("Starting NFC payment flow...");

    // Pre-flight checks
    const supported = await this.isSupported();
    if (!supported) {
      throw new NfcError(
        "NFC is not supported on this device",
        "NOT_SUPPORTED"
      );
    }

    const enabled = await this.isEnabled();
    if (!enabled) {
      throw new NfcError(
        "NFC is disabled. Please enable NFC in your device settings.",
        "NOT_ENABLED"
      );
    }

    log.debug("Requesting IsoDep technology...");

    try {
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      log.info("IsoDep technology acquired, communicating with PoS...");
    } catch (error) {
      log.error("Failed to acquire IsoDep technology:", error);
      throw new NfcError(
        `Failed to connect to NFC tag: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "TECHNOLOGY_REQUEST_FAILED"
      );
    }

    try {
      // ===== PHASE 1: READ PAYMENT REQUEST =====
      log.info("Phase 1: Reading payment request...");

      // 1) SELECT AID
      log.debug("SELECT NDEF Tag Application AID");
      let r = await sendApdu(SELECT_AID, "SELECT AID");
      if (!r.ok) {
        throw new NfcError(
          `AID not accepted by tag (${getStatusMessage(r.sw)})`,
          "AID_SELECT_FAILED",
          r.sw
        );
      }

      // 2) SELECT NDEF FILE
      log.debug("SELECT NDEF File (E104)");
      r = await sendApdu(SELECT_NDEF, "SELECT NDEF");
      if (!r.ok) {
        throw new NfcError(
          `NDEF file not accessible (${getStatusMessage(r.sw)})`,
          "NDEF_SELECT_FAILED",
          r.sw
        );
      }

      // 3) Read NLEN
      r = await sendApdu(READ_BINARY(0, 2), "READ NLEN");
      if (!r.ok) {
        throw new NfcError(
          `Failed reading NLEN (${getStatusMessage(r.sw)})`,
          "READ_NLEN_FAILED",
          r.sw
        );
      }

      const nlen = (r.payload[0] << 8) | r.payload[1];
      log.debug(`NLEN = ${nlen} bytes`);

      if (nlen === 0) {
        throw new NfcError(
          "NDEF file is empty (NLEN=0). No payment request available.",
          "EMPTY_NDEF"
        );
      }

      // 4) Read NDEF body
      let ndefBytes: number[] = [];
      const MAX_READ_SIZE = 250;

      if (nlen <= MAX_READ_SIZE) {
        r = await sendApdu(READ_BINARY(2, nlen), "READ NDEF");
        if (!r.ok) {
          throw new NfcError(
            `Failed reading NDEF content (${getStatusMessage(r.sw)})`,
            "READ_NDEF_FAILED",
            r.sw
          );
        }
        ndefBytes = r.payload;
      } else {
        log.debug(`Large NDEF message, reading in chunks...`);
        let offset = 2;
        let remaining = nlen;

        while (remaining > 0) {
          const chunkSize = Math.min(remaining, MAX_READ_SIZE);
          r = await sendApdu(
            READ_BINARY(offset, chunkSize),
            `READ chunk @${offset}`
          );
          if (!r.ok) {
            throw new NfcError(
              `Failed reading NDEF chunk at offset ${offset}`,
              "READ_NDEF_CHUNK_FAILED",
              r.sw
            );
          }
          ndefBytes.push(...r.payload);
          offset += chunkSize;
          remaining -= chunkSize;
        }
      }

      const paymentRequest = decodeTextRecord(ndefBytes);
      log.info(`Read payment request (${paymentRequest.length} chars)`);
      log.debug(`Payment request: ${paymentRequest.substring(0, 60)}...`);

      // ===== PHASE 2: CREATE TOKEN (user callback) =====
      log.info("Phase 2: Creating token (calling user callback)...");
      let token: string;
      try {
        token = await createToken(paymentRequest);
      } catch (error) {
        log.error("Token creation failed:", error);
        // Re-throw the original error to preserve custom error types (e.g., LimitExceededError)
        // The caller can handle these errors appropriately
        throw error;
      }

      if (!token || token.length === 0) {
        throw new NfcError(
          "Token callback returned empty token",
          "INVALID_TOKEN"
        );
      }

      log.info(`Token created (${token.length} chars)`);
      log.debug(`Token preview: ${token.substring(0, 50)}...`);

      // ===== PHASE 3: WRITE TOKEN BACK =====
      log.info("Phase 3: Writing token back to PoS...");

      // Re-select NDEF file (may be needed after the callback took time)
      log.debug("Re-SELECT NDEF File for writing");
      r = await sendApdu(SELECT_NDEF, "SELECT NDEF (write)");
      if (!r.ok) {
        throw new NfcError(
          `NDEF file not accessible for write (${getStatusMessage(r.sw)})`,
          "NDEF_SELECT_FAILED",
          r.sw
        );
      }

      // Build NDEF message
      const ndef = buildTextNdef(token);
      const writeNlen = (ndef[0] << 8) | ndef[1];
      log.debug(`NDEF message: NLEN=${writeNlen}, total=${ndef.length} bytes`);

      // Write NLEN first (Pattern A)
      r = await sendApdu(UPDATE_BINARY(0, [ndef[0], ndef[1]]), "WRITE NLEN");
      if (!r.ok) {
        throw new NfcError(
          `Failed writing NLEN (${getStatusMessage(r.sw)})`,
          "WRITE_NLEN_FAILED",
          r.sw
        );
      }

      // Write body in chunks
      const CHUNK_SIZE = 240;
      let offset = 2;
      const body = ndef.slice(2);
      const totalChunks = Math.ceil(body.length / CHUNK_SIZE);
      let chunkNum = 0;

      while (offset - 2 < body.length) {
        const chunk = body.slice(offset - 2, offset - 2 + CHUNK_SIZE);
        chunkNum++;
        log.debug(
          `Writing chunk ${chunkNum}/${totalChunks}: ${chunk.length} bytes`
        );

        r = await sendApdu(
          UPDATE_BINARY(offset, chunk),
          `WRITE chunk ${chunkNum}`
        );
        if (!r.ok) {
          throw new NfcError(
            `Failed writing chunk ${chunkNum} (${getStatusMessage(r.sw)})`,
            "WRITE_CHUNK_FAILED",
            r.sw
          );
        }
        offset += chunk.length;
      }

      log.info("✓ NFC payment completed successfully!");
      return { request: paymentRequest };
    } finally {
      log.debug("Releasing NFC technology...");
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (cleanupError) {
        log.warn("Failed to release NFC technology:", cleanupError);
      }
    }
  }

  /**
   * Write a Cashu token to an NFC tag (PoS terminal).
   * Used for completing over-limit payments after user confirmation.
   *
   * @param token The Cashu token string (e.g., "cashuA..." or "cashuB...")
   */
  static async writeCashuToken(token: string): Promise<void> {
    log.info(`Starting NFC token write (${token.length} chars)...`);
    log.debug(`Token preview: ${token.substring(0, 50)}...`);

    // Pre-flight checks
    const supported = await this.isSupported();
    if (!supported) {
      throw new NfcError(
        "NFC is not supported on this device",
        "NOT_SUPPORTED"
      );
    }

    const enabled = await this.isEnabled();
    if (!enabled) {
      throw new NfcError(
        "NFC is disabled. Please enable NFC in your device settings.",
        "NOT_ENABLED"
      );
    }

    if (!token || token.length === 0) {
      throw new NfcError("Token cannot be empty", "INVALID_TOKEN");
    }

    log.debug("Requesting IsoDep technology...");

    try {
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      log.info("IsoDep technology acquired, communicating with tag...");
    } catch (error) {
      log.error("Failed to acquire IsoDep technology:", error);
      throw new NfcError(
        `Failed to connect to NFC tag: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "TECHNOLOGY_REQUEST_FAILED"
      );
    }

    try {
      // 1) SELECT AID
      log.debug("Step 1: SELECT NDEF Tag Application AID");
      let r = await sendApdu(SELECT_AID, "SELECT AID");
      if (!r.ok) {
        throw new NfcError(
          `AID not accepted by tag (${getStatusMessage(r.sw)})`,
          "AID_SELECT_FAILED",
          r.sw
        );
      }

      // 2) SELECT NDEF FILE
      log.debug("Step 2: SELECT NDEF File (E104)");
      r = await sendApdu(SELECT_NDEF, "SELECT NDEF");
      if (!r.ok) {
        throw new NfcError(
          `NDEF file not accessible (${getStatusMessage(r.sw)})`,
          "NDEF_SELECT_FAILED",
          r.sw
        );
      }

      // 3) Build outgoing NDEF with token
      log.debug("Step 3: Building NDEF Text record...");
      const ndef = buildTextNdef(token);
      const nlen = (ndef[0] << 8) | ndef[1];
      log.debug(`NDEF message built: NLEN=${nlen}, total=${ndef.length} bytes`);

      // 4) Write NLEN first (Pattern A from spec)
      log.debug("Step 4: UPDATE BINARY - Write NLEN at offset 0");
      r = await sendApdu(UPDATE_BINARY(0, [ndef[0], ndef[1]]), "WRITE NLEN");
      if (!r.ok) {
        throw new NfcError(
          `Failed writing NLEN (${getStatusMessage(r.sw)})`,
          "WRITE_NLEN_FAILED",
          r.sw
        );
      }

      // 5) Write body in chunks <= 240 bytes (safe for most implementations)
      const CHUNK_SIZE = 240;
      let offset = 2;
      const body = ndef.slice(2);
      const totalChunks = Math.ceil(body.length / CHUNK_SIZE);
      let chunkNum = 0;

      log.debug(
        `Step 5: Writing ${body.length} bytes in ${totalChunks} chunk(s)...`
      );

      while (offset - 2 < body.length) {
        const chunk = body.slice(offset - 2, offset - 2 + CHUNK_SIZE);
        chunkNum++;
        log.debug(
          `Writing chunk ${chunkNum}/${totalChunks}: ${chunk.length} bytes at offset ${offset}`
        );

        r = await sendApdu(
          UPDATE_BINARY(offset, chunk),
          `WRITE chunk ${chunkNum}`
        );
        if (!r.ok) {
          throw new NfcError(
            `Failed writing chunk ${chunkNum} at offset ${offset} (${getStatusMessage(
              r.sw
            )})`,
            "WRITE_CHUNK_FAILED",
            r.sw
          );
        }
        offset += chunk.length;
      }

      log.info("Successfully wrote Cashu token to NFC tag");
    } finally {
      log.debug("Releasing NFC technology...");
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (cleanupError) {
        log.warn("Failed to release NFC technology:", cleanupError);
      }
    }
  }
}

// --------- NDEF TEXT RECORD PARSER -------------
// Supports both Short Record (SR=1) and Normal Record (SR=0) formats
const SHORT_RECORD_FLAG = 0x10;

function decodeTextRecord(ndef: number[]): string {
  if (!ndef || ndef.length < 4) {
    throw new NfcError(
      `Invalid NDEF data: too short (${ndef?.length || 0} bytes)`,
      "INVALID_NDEF_FORMAT"
    );
  }

  // ndef = [recordHeader...], no NLEN here (already removed)
  const header = ndef[0];
  const typeLen = ndef[1];
  const isShortRecord = (header & SHORT_RECORD_FLAG) !== 0;

  log.debug(
    `Parsing NDEF: header=0x${header.toString(
      16
    )}, typeLen=${typeLen}, SR=${isShortRecord}`
  );

  // Validate TNF (Type Name Format) - should be 0x01 (NFC Forum well-known type)
  const tnf = header & 0x07;
  if (tnf !== 0x01) {
    log.warn(`Unexpected TNF: ${tnf} (expected 1 for well-known type)`);
  }

  let payloadLen: number;
  let typeFieldStart: number;

  if (isShortRecord) {
    // SR format: 1-byte payload length at offset 2
    payloadLen = ndef[2];
    typeFieldStart = 3;
  } else {
    // Normal format: 4-byte big-endian payload length at offset 2-5
    if (ndef.length < 7) {
      throw new NfcError(
        "Invalid NDEF: normal record header too short",
        "INVALID_NDEF_FORMAT"
      );
    }
    payloadLen =
      ((ndef[2] << 24) | (ndef[3] << 16) | (ndef[4] << 8) | ndef[5]) >>> 0;
    typeFieldStart = 6;
  }

  log.debug(
    `Payload length: ${payloadLen}, type field starts at: ${typeFieldStart}`
  );

  if (typeFieldStart >= ndef.length) {
    throw new NfcError(
      "Invalid NDEF: type field offset out of bounds",
      "INVALID_NDEF_FORMAT"
    );
  }

  const type = ndef[typeFieldStart];
  if (type !== 0x54) {
    // 0x54 = 'T' for Text
    throw new NfcError(
      `Not a Text record (type=0x${type.toString(16)}, expected 0x54 'T')`,
      "NOT_TEXT_RECORD"
    );
  }

  const payloadStart = typeFieldStart + typeLen;

  if (payloadStart >= ndef.length) {
    throw new NfcError(
      "Invalid NDEF: payload start out of bounds",
      "INVALID_NDEF_FORMAT"
    );
  }

  const status = ndef[payloadStart];
  const langLen = status & 0x3f;
  const isUtf16 = (status & 0x80) !== 0;

  log.debug(
    `Text record: status=0x${status.toString(
      16
    )}, langLen=${langLen}, UTF-16=${isUtf16}`
  );

  if (isUtf16) {
    log.warn("UTF-16 encoding detected - this implementation assumes UTF-8");
  }

  const textStart = payloadStart + 1 + langLen;
  const textLen = payloadLen - 1 - langLen;

  if (textStart + textLen > ndef.length) {
    throw new NfcError(
      `Invalid NDEF: text data out of bounds (textStart=${textStart}, textLen=${textLen}, ndefLen=${ndef.length})`,
      "INVALID_NDEF_FORMAT"
    );
  }

  const textBytes = ndef.slice(textStart, textStart + textLen);
  const text = Buffer.from(textBytes).toString("utf8");

  log.debug(`Decoded text: ${textLen} bytes -> ${text.length} chars`);

  return text;
}
