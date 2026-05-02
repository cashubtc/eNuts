import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { NfcIcon, ExclamationIcon } from "@comps/Icons";
import { useNfcAmountLimitsContext, NO_LIMIT } from "@src/context/NfcAmountLimits";
import {
  useNfcPayment,
  type NfcPaymentHandoff,
  type NfcPaymentResult,
  type LimitExceededError,
} from "@comps/hooks/useNfcPayment";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi } from "@styles";

export interface NfcPaymentModalRef {
  /** Open the modal and start NFC payment with the default limit */
  open: () => void;
  /** Close the modal */
  close: () => void;
}

interface INfcPaymentModalProps {
  /** Called when payment completes successfully */
  onSuccess?: (result: NfcPaymentResult) => void;
  /** Called when payment fails */
  onError?: (result: NfcPaymentResult) => void;
  /** Called when the NFC payload should be handled by another payment flow */
  onPaymentHandoff?: (handoff: NfcPaymentHandoff) => void;
  /** Called when modal is closed/cancelled */
  onClose?: () => void;
}

/** Info stored when a payment exceeds the configured limit and needs confirmation */
interface PendingConfirmation {
  paymentRequest: string;
  amount: number;
  mint: string;
  maxAmount: number;
}

const NfcPaymentModal = forwardRef<NfcPaymentModalRef, INfcPaymentModalProps>(
  ({ onSuccess, onError, onPaymentHandoff, onClose }, ref) => {
    const { t } = useTranslation([NS.common]);
    const { color, highlight } = useThemeContext();
    const { formatBalance, formatSatsAsCurrency, rates, selectedCurrency } = useCurrencyContext();

    const sheetRef = useRef<TrueSheet>(null);
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(
      null,
    );

    const { defaultMaxAmount } = useNfcAmountLimitsContext();
    const currencySymbol = rates?.[selectedCurrency]?.symbol || selectedCurrency;

    // NFC Payment logic
    const { isActive, statusMessage, startPayment, completeOverLimitPayment } = useNfcPayment({
      onPaymentSuccess: (result) => {
        setPendingConfirmation(null);
        void sheetRef.current?.dismiss();
        onSuccess?.(result);
      },
      onPaymentError: (result) => {
        setPendingConfirmation(null);
        void sheetRef.current?.dismiss();
        onError?.(result);
      },
      onPaymentHandoff: (handoff) => {
        setPendingConfirmation(null);
        void sheetRef.current?.dismiss();
        onPaymentHandoff?.(handoff);
      },
      onLimitExceeded: (error: LimitExceededError) => {
        // Store the payment details and show confirmation UI
        setPendingConfirmation({
          paymentRequest: error.paymentRequest,
          amount: error.amount,
          mint: error.mint,
          maxAmount: error.maxAmount,
        });
      },
    });

    // Start payment with default limit
    const startPaymentWithDefaultLimit = useCallback(() => {
      const maxAmount = defaultMaxAmount === NO_LIMIT ? undefined : defaultMaxAmount;
      void startPayment({ maxAmount });
    }, [defaultMaxAmount, startPayment]);

    // Handle confirmation of over-limit payment
    const handleConfirmOverLimit = useCallback(() => {
      if (!pendingConfirmation) return;
      const { paymentRequest, amount, mint } = pendingConfirmation;
      void completeOverLimitPayment(paymentRequest, amount, mint);
    }, [pendingConfirmation, completeOverLimitPayment]);

    // Handle declining the over-limit payment
    const handleDeclineOverLimit = useCallback(() => {
      setPendingConfirmation(null);
      void sheetRef.current?.dismiss();
      onClose?.();
    }, [onClose]);

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setPendingConfirmation(null);
          void sheetRef.current?.present().then(startPaymentWithDefaultLimit);
        },
        close: () => {
          setPendingConfirmation(null);
          void sheetRef.current?.dismiss();
        },
      }),
      [startPaymentWithDefaultLimit],
    );

    const showConfirmation = pendingConfirmation !== null && !isActive;
    const showNfcWaiting = isActive || !pendingConfirmation;

    // Format the pending amount for display
    const pendingAmountFiat =
      pendingConfirmation && formatBalance && rates
        ? formatSatsAsCurrency(pendingConfirmation.amount)
        : null;
    const pendingLimitFiat =
      pendingConfirmation && formatBalance && rates
        ? formatSatsAsCurrency(pendingConfirmation.maxAmount)
        : null;

    // Header title
    const headerTitle = showConfirmation
      ? t("nfcConfirmPayment", {
          ns: NS.wallet,
          defaultValue: "Confirm Payment",
        })
      : t("nfcPayment", {
          ns: NS.wallet,
          defaultValue: "NFC Payment",
        });

    return (
      <TrueSheet
        ref={sheetRef}
        detents={["auto"]}
        dismissible={!isActive}
        draggable={!isActive}
        backgroundColor={color.BACKGROUND}
        cornerRadius={26}
        grabberOptions={{ color: color.TEXT_SECONDARY }}
      >
        <View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
          <View style={styles.header}>
            {showConfirmation ? (
              <ExclamationIcon width={28} color={hi[highlight]} />
            ) : (
              <NfcIcon width={28} color={hi[highlight]} />
            )}
            <Txt txt={headerTitle} bold styles={[styles.title]} />
          </View>

          {showConfirmation && pendingConfirmation && (
            <View style={styles.confirmationContainer}>
              <Txt
                txt={t("nfcAmountExceedsLimit", {
                  ns: NS.wallet,
                  defaultValue: "This payment exceeds your configured limit.",
                })}
                styles={[styles.confirmationText, { color: color.TEXT_SECONDARY }]}
              />

              <View
                style={[
                  styles.confirmationBox,
                  {
                    backgroundColor: color.INPUT_BG,
                    borderColor: color.BORDER,
                  },
                ]}
              >
                <View style={styles.confirmationRow}>
                  <Txt
                    txt={t("amount", { ns: NS.common, defaultValue: "Amount" })}
                    styles={[styles.confirmationLabel, { color: color.TEXT_SECONDARY }]}
                  />
                  <View style={styles.confirmationValue}>
                    <Txt
                      txt={`${pendingConfirmation.amount.toLocaleString()} sats`}
                      bold
                      styles={[{ color: color.TEXT }]}
                    />
                    {pendingAmountFiat && (
                      <Txt
                        txt={`≈ ${currencySymbol}${pendingAmountFiat}`}
                        styles={[styles.confirmationFiat, { color: color.TEXT_SECONDARY }]}
                      />
                    )}
                  </View>
                </View>

                <Separator style={styles.confirmationSeparator} />

                <View style={styles.confirmationRow}>
                  <Txt
                    txt={t("yourLimit", {
                      ns: NS.wallet,
                      defaultValue: "Your limit",
                    })}
                    styles={[styles.confirmationLabel, { color: color.TEXT_SECONDARY }]}
                  />
                  <View style={styles.confirmationValue}>
                    <Txt
                      txt={`${pendingConfirmation.maxAmount.toLocaleString()} sats`}
                      styles={[{ color: color.TEXT }]}
                    />
                    {pendingLimitFiat && (
                      <Txt
                        txt={`≈ ${currencySymbol}${pendingLimitFiat}`}
                        styles={[styles.confirmationFiat, { color: color.TEXT_SECONDARY }]}
                      />
                    )}
                  </View>
                </View>
              </View>

              <Txt
                txt={t("nfcTapAgainAfterConfirm", {
                  ns: NS.wallet,
                  defaultValue: "You will need to tap the terminal again after confirming.",
                })}
                styles={[styles.confirmationHint, { color: color.TEXT_SECONDARY }]}
              />

              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[
                    styles.confirmationButton,
                    styles.declineButton,
                    { borderColor: color.BORDER },
                  ]}
                  onPress={handleDeclineOverLimit}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.declineButtonText, { color: color.TEXT }]}>
                    {t("cancel", { ns: NS.common, defaultValue: "Cancel" })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmationButton,
                    styles.confirmButton,
                    { backgroundColor: hi[highlight] },
                  ]}
                  onPress={handleConfirmOverLimit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmButtonText}>
                    {t("confirm", { ns: NS.common, defaultValue: "Confirm" })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showNfcWaiting && (
            <View style={styles.loading}>
              <View style={[styles.pulse, { borderColor: hi[highlight] }]}>
                <NfcIcon width={40} color={hi[highlight]} />
              </View>
              <Txt txt={statusMessage} styles={[{ color: color.TEXT_SECONDARY }]} />
            </View>
          )}
        </View>
      </TrueSheet>
    );
  },
);

NfcPaymentModal.displayName = "NfcPaymentModal";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 18,
  },
  loading: {
    alignItems: "center",
    paddingVertical: 32,
  },
  pulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  // Confirmation UI styles
  confirmationContainer: {
    paddingVertical: 8,
  },
  confirmationText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmationBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  confirmationLabel: {
    fontSize: 14,
  },
  confirmationValue: {
    alignItems: "flex-end",
  },
  confirmationFiat: {
    fontSize: 12,
    marginTop: 2,
  },
  confirmationSeparator: {
    marginHorizontal: 16,
  },
  confirmationHint: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  declineButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});

export default NfcPaymentModal;
