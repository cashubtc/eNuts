import { useState, useCallback } from "react";
import { useManager } from "coco-cashu-react";
import { getEncodedToken, PaymentRequest } from "@cashu/cashu-ts";
import NfcCashuPayment, { NfcError } from "@src/services/NFCService";
import { appLogger } from "@src/logger";

const log = appLogger.child({ name: "useNfcPayment" });

export interface NfcPaymentResult {
  success: boolean;
  paymentRequest?: string;
  amount?: number;
  mint?: string;
  error?: string;
  errorCode?: string;
}

export interface StartPaymentOptions {
  /** Maximum amount in sats to allow. If the request exceeds this, payment is aborted. */
  maxAmount?: number;
}

export interface UseNfcPaymentOptions {
  /** Called when payment starts */
  onPaymentStart?: () => void;
  /** Called when payment completes successfully */
  onPaymentSuccess?: (result: NfcPaymentResult) => void;
  /** Called when payment fails */
  onPaymentError?: (result: NfcPaymentResult) => void;
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
export function useNfcPayment(
  options: UseNfcPaymentOptions = {}
): UseNfcPaymentReturn {
  const { onPaymentStart, onPaymentSuccess, onPaymentError, onPaymentEnd } =
    options;
  const manager = useManager();
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");

  const startPayment = useCallback(
    async (
      paymentOptions: StartPaymentOptions = {}
    ): Promise<NfcPaymentResult> => {
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

      try {
        const result = await NfcCashuPayment.performPayment(async (request) => {
          paymentRequest = request;
          log.info("Payment request received");
          setStatusMessage("Processing payment...");

          const pr = PaymentRequest.fromEncodedRequest(request);

          if (!pr.mints || pr.mints.length === 0) {
            throw new Error("Payment request has no mints specified");
          }
          if (!pr.amount) {
            throw new Error("Payment request has no amount specified");
          }

          // Check max amount limit
          if (maxAmount !== undefined && pr.amount > maxAmount) {
            log.warn(
              `Payment amount ${pr.amount} exceeds max allowed ${maxAmount}`
            );
            throw new NfcPaymentError(
              `Amount ${pr.amount} sats exceeds maximum allowed (${maxAmount} sats)`,
              "AMOUNT_EXCEEDS_MAX"
            );
          }

          paymentAmount = pr.amount;
          paymentMint = pr.mints[0]!;

          log.info(`Creating token for ${pr.amount} sats from ${paymentMint}`);
          setStatusMessage(`Sending ${pr.amount} sats...`);

          const token = await manager.wallet.send(paymentMint, pr.amount);

          setStatusMessage("Writing to terminal...");
          return getEncodedToken(token);
        });

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
        const errorMessage =
          error instanceof Error ? error.message : "NFC payment failed";
        const errorCode =
          error instanceof NfcError || error instanceof NfcPaymentError
            ? error.code
            : "UNKNOWN";

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
    [isActive, manager, onPaymentStart, onPaymentSuccess, onPaymentError, onPaymentEnd]
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
    cancel,
  };
}

/**
 * Error class for NFC payment-specific errors (not NFC protocol errors)
 */
export class NfcPaymentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "NfcPaymentError";
    this.code = code;
  }
}

export default useNfcPayment;
