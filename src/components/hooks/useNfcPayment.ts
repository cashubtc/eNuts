import { useState, useCallback } from "react";
import { useManager } from "@cashu/coco-react";
import { getEncodedToken } from "@cashu/cashu-ts";
import NfcCashuPayment, { NfcError } from "@src/services/NFCService";
import { appLogger } from "@src/logger";
import { parsePaymentString, type PaymentCandidateKind } from "@util/paymentStringParser";

const log = appLogger.child({ name: "useNfcPayment" });

type TNfcPaymentHandoffKind = Extract<
  PaymentCandidateKind,
  "lightningInvoice" | "lightningAddress" | "lnurl"
>;

const NFC_CANDIDATE_PRIORITY: PaymentCandidateKind[] = [
  "cashuPaymentRequest",
  "lightningInvoice",
  "lightningAddress",
  "lnurl",
];

function selectNfcCandidate(request: string) {
  const candidates = parsePaymentString(request);
  return NFC_CANDIDATE_PRIORITY.map((kind) =>
    candidates.find((candidate) => candidate.kind === kind),
  ).find((candidate) => Boolean(candidate));
}

function isNfcPaymentHandoffKind(kind: PaymentCandidateKind): kind is TNfcPaymentHandoffKind {
  return kind === "lightningInvoice" || kind === "lightningAddress" || kind === "lnurl";
}

export interface NfcPaymentHandoff {
  kind: TNfcPaymentHandoffKind;
  value: string;
}

export interface NfcPaymentResult {
  success: boolean;
  paymentRequest?: string;
  amount?: number;
  mint?: string;
  error?: string;
  errorCode?: string;
  handoff?: NfcPaymentHandoff;
}

export interface StartPaymentOptions {
  /** Maximum amount in sats to allow. If the request exceeds this, payment is aborted. */
  maxAmount?: number;
}

/**
 * Error thrown when a payment request exceeds the configured limit.
 * Contains all information needed to complete the payment after user confirmation.
 */
export class LimitExceededError extends Error {
  code = "LIMIT_EXCEEDED";
  paymentRequest: string;
  amount: number;
  mint: string;
  maxAmount: number;

  constructor(paymentRequest: string, amount: number, mint: string, maxAmount: number) {
    super(`Amount ${amount} sats exceeds limit of ${maxAmount} sats`);
    this.name = "LimitExceededError";
    this.paymentRequest = paymentRequest;
    this.amount = amount;
    this.mint = mint;
    this.maxAmount = maxAmount;
  }
}

export interface UseNfcPaymentOptions {
  /** Called when payment starts */
  onPaymentStart?: () => void;
  /** Called when payment completes successfully */
  onPaymentSuccess?: (result: NfcPaymentResult) => void;
  /** Called when payment fails */
  onPaymentError?: (result: NfcPaymentResult) => void;
  /** Called when payment amount exceeds the configured limit */
  onLimitExceeded?: (error: LimitExceededError) => void;
  /** Called when the NFC payload should be handled by another payment flow */
  onPaymentHandoff?: (handoff: NfcPaymentHandoff) => void;
  /** Called when payment ends (success or failure) */
  onPaymentEnd?: () => void;
}

export interface UseNfcPaymentReturn {
  /** Whether an NFC payment is currently in progress */
  isActive: boolean;
  /** Current status message for UI display */
  statusMessage: string;
  /** Initiate an NFC payment */
  startPayment: (options?: StartPaymentOptions) => Promise<NfcPaymentResult>;
  /** Complete a payment that exceeded the limit (after user confirmation) */
  completeOverLimitPayment: (
    paymentRequest: string,
    amount: number,
    mint: string,
  ) => Promise<NfcPaymentResult>;
  /** Cancel the current payment (if possible) */
  cancel: () => void;
}

/**
 * Custom hook for handling NFC Cashu payments.
 *
 * @example
 * ```tsx
 * const { isActive, statusMessage, startPayment } = useNfcPayment({
 *   onPaymentSuccess: (result) => {
 *     console.log(`Paid ${result.amount} sats!`);
 *   },
 *   onPaymentError: (result) => {
 *     console.error(result.error);
 *   },
 * });
 *
 * // Pay with no limit
 * <Button onPress={() => startPayment()} title="Pay" />
 *
 * // Pay with max 1000 sats limit
 * <Button onPress={() => startPayment({ maxAmount: 1000 })} title="Pay (max 1000 sats)" />
 * ```
 */
export function useNfcPayment(options: UseNfcPaymentOptions = {}): UseNfcPaymentReturn {
  const {
    onPaymentStart,
    onPaymentSuccess,
    onPaymentError,
    onLimitExceeded,
    onPaymentHandoff,
    onPaymentEnd,
  } = options;
  const manager = useManager();
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");

  const startPayment = useCallback(
    async (paymentOptions: StartPaymentOptions = {}): Promise<NfcPaymentResult> => {
      const { maxAmount } = paymentOptions;

      if (isActive) {
        log.warn("Payment already in progress");
        return {
          success: false,
          error: "Payment already in progress",
          errorCode: "ALREADY_ACTIVE",
        };
      }

      setIsActive(true);
      setStatusMessage("Hold near terminal...");
      onPaymentStart?.();

      let paymentAmount: number | undefined;
      let paymentMint: string | undefined;
      let paymentRequest: string | undefined;
      let paymentHandoff: NfcPaymentHandoff | undefined;

      try {
        const result = await NfcCashuPayment.performPayment(async (request) => {
          const selectedCandidate = selectNfcCandidate(request);

          if (!selectedCandidate) {
            throw new Error("NFC payload does not contain a supported payment request");
          }

          if (isNfcPaymentHandoffKind(selectedCandidate.kind)) {
            paymentHandoff = {
              kind: selectedCandidate.kind,
              value: selectedCandidate.value,
            };
            setStatusMessage("Opening payment screen...");
            return { type: "finish" };
          }

          const cashuPaymentRequest = selectedCandidate.value;
          paymentRequest = cashuPaymentRequest;
          log.info("Payment request received");
          setStatusMessage("Processing payment...");
          const parsedPr = await manager.paymentRequests.parse(cashuPaymentRequest);
          if (parsedPr.payableMints.length === 0) {
            throw new Error("No matching mints found");
          }
          if (!parsedPr.amount) {
            throw new Error("Payment request has no amount specified");
          }
          if (maxAmount !== undefined && parsedPr.amount > maxAmount) {
            log.warn(`Payment amount ${parsedPr.amount} exceeds max allowed ${maxAmount}`);
            throw new LimitExceededError(
              cashuPaymentRequest,
              parsedPr.amount,
              parsedPr.payableMints[0],
              maxAmount,
            );
          }
          const preparedRequest = await manager.paymentRequests.prepare(parsedPr, {
            mintUrl: parsedPr.payableMints[0],
          });
          paymentAmount = preparedRequest.sendOperation.amount;
          paymentMint = preparedRequest.sendOperation.mintUrl;
          log.info(`Creating token for ${parsedPr.amount} sats from ${parsedPr.payableMints[0]}`);
          setStatusMessage(`Sending ${parsedPr.amount} sats...`);
          const executionResult = await manager.paymentRequests.execute(preparedRequest);
          if (executionResult.type !== "inband") {
            throw new Error("Terminal returned an unsupported payment transport");
          }
          const token = executionResult.token;

          setStatusMessage("Writing to terminal...");
          return { type: "writeText", text: getEncodedToken(token) };
        });

        if (!result.wroteResponse && paymentHandoff) {
          log.info(`NFC payment handoff received: ${paymentHandoff.kind}`);
          setStatusMessage("Opening payment screen...");
          onPaymentHandoff?.(paymentHandoff);
          return {
            success: false,
            paymentRequest: result.request,
            handoff: paymentHandoff,
          };
        }

        log.info("NFC payment completed successfully");
        setStatusMessage("Payment complete!");

        const successResult: NfcPaymentResult = {
          success: true,
          paymentRequest: result.request,
          amount: paymentAmount,
          mint: paymentMint,
        };

        onPaymentSuccess?.(successResult);
        return successResult;
      } catch (error) {
        // Handle limit exceeded separately - don't treat as error
        if (error instanceof LimitExceededError) {
          log.info(
            `Payment requires confirmation: ${error.amount} sats exceeds limit of ${error.maxAmount} sats`,
          );
          setStatusMessage("Confirmation required");
          onLimitExceeded?.(error);
          // Return a result indicating limit exceeded (not a failure)
          return {
            success: false,
            paymentRequest: error.paymentRequest,
            amount: error.amount,
            mint: error.mint,
            error: error.message,
            errorCode: error.code,
          };
        }

        const errorMessage = error instanceof Error ? error.message : "NFC payment failed";
        const errorCode = error instanceof NfcError ? error.code : "UNKNOWN";

        log.error("NFC payment failed:", errorMessage);
        setStatusMessage("Payment failed");

        const errorResult: NfcPaymentResult = {
          success: false,
          paymentRequest,
          amount: paymentAmount,
          mint: paymentMint,
          error: errorMessage,
          errorCode,
        };

        onPaymentError?.(errorResult);
        return errorResult;
      } finally {
        setIsActive(false);
        setStatusMessage("Ready");
        onPaymentEnd?.();
      }
    },
    [
      isActive,
      manager,
      onPaymentStart,
      onPaymentSuccess,
      onPaymentError,
      onLimitExceeded,
      onPaymentHandoff,
      onPaymentEnd,
    ],
  );

  /**
   * Complete a payment that exceeded the limit after user confirmation.
   * This creates the token and writes it to the NFC tag in a new session.
   */
  const completeOverLimitPayment = useCallback(
    async (paymentRequest: string, amount: number, mint: string): Promise<NfcPaymentResult> => {
      if (isActive) {
        log.warn("Payment already in progress");
        return {
          success: false,
          error: "Payment already in progress",
          errorCode: "ALREADY_ACTIVE",
        };
      }

      setIsActive(true);
      onPaymentStart?.();

      try {
        // Create the token
        log.info(`Creating token for confirmed payment: ${amount} sats from ${mint}`);
        setStatusMessage(`Sending ${amount} sats...`);
        const preparedSend = await manager.ops.send.prepare({ mintUrl: mint, amount });
        const { token } = await manager.ops.send.execute(preparedSend.id);
        const encodedToken = getEncodedToken(token);

        // Write to NFC in a new session
        log.info("Writing token to NFC...");
        setStatusMessage("Hold near terminal...");
        await NfcCashuPayment.writeCashuToken(encodedToken);

        log.info("Over-limit payment completed successfully");
        setStatusMessage("Payment complete!");

        const successResult: NfcPaymentResult = {
          success: true,
          paymentRequest,
          amount,
          mint,
        };

        onPaymentSuccess?.(successResult);
        return successResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "NFC payment failed";
        const errorCode = error instanceof NfcError ? error.code : "UNKNOWN";

        log.error("Over-limit payment failed:", errorMessage);
        setStatusMessage("Payment failed");

        const errorResult: NfcPaymentResult = {
          success: false,
          paymentRequest,
          amount,
          mint,
          error: errorMessage,
          errorCode,
        };

        onPaymentError?.(errorResult);
        return errorResult;
      } finally {
        setIsActive(false);
        setStatusMessage("Ready");
        onPaymentEnd?.();
      }
    },
    [isActive, manager, onPaymentStart, onPaymentSuccess, onPaymentError, onPaymentEnd],
  );

  const cancel = useCallback(() => {
    // Note: NFC operations can't be truly cancelled mid-flight,
    // but we can reset the UI state
    if (isActive) {
      log.info("Payment cancelled by user");
      setIsActive(false);
      setStatusMessage("Ready");
    }
  }, [isActive]);

  return {
    isActive,
    statusMessage,
    startPayment,
    completeOverLimitPayment,
    cancel,
  };
}

export default useNfcPayment;
