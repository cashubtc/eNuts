import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { View, TouchableOpacity, Text } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useTranslation } from "react-i18next";

import { TxtButton } from "@comps/Button";
import { NfcIcon } from "@comps/Icons";
import {
  useNfcAmountLimitsContext,
  NO_LIMIT,
} from "@src/context/NfcAmountLimits";
import {
  useNfcPayment,
  type NfcPaymentResult,
} from "@comps/hooks/useNfcPayment";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi } from "@styles";

export interface NfcPaymentModalRef {
  /** Open the modal with amount selection */
  open: () => void;
  /** Open the modal and immediately start payment with default amount */
  openWithDefault: () => void;
  /** Close the modal */
  close: () => void;
}

interface INfcPaymentModalProps {
  /** Called when payment completes successfully */
  onSuccess?: (result: NfcPaymentResult) => void;
  /** Called when payment fails */
  onError?: (result: NfcPaymentResult) => void;
  /** Called when modal is closed/cancelled */
  onClose?: () => void;
}

const NfcPaymentModal = forwardRef<NfcPaymentModalRef, INfcPaymentModalProps>(
  ({ onSuccess, onError, onClose }, ref) => {
    const { t } = useTranslation([NS.common]);
    const { color, highlight } = useThemeContext();
    const { formatBalance, formatSatsAsCurrency, rates, selectedCurrency } =
      useCurrencyContext();

    const bottomSheetRef = useRef<BottomSheet>(null);
    const [useDefaultOnOpen, setUseDefaultOnOpen] = useState(false);

    const { customAmounts, defaultMaxAmount } = useNfcAmountLimitsContext();
    const currencySymbol =
      rates?.[selectedCurrency]?.symbol || selectedCurrency;

    // NFC Payment logic
    const {
      isActive,
      statusMessage,
      startPayment,
      cancel: cancelPayment,
    } = useNfcPayment({
      onPaymentSuccess: (result) => {
        setUseDefaultOnOpen(false);
        bottomSheetRef.current?.close();
        onSuccess?.(result);
      },
      onPaymentError: (result) => {
        setUseDefaultOnOpen(false);
        bottomSheetRef.current?.close();
        onError?.(result);
      },
    });

    // Handle amount selection (from list or auto-start)
    const handleSelectAmount = useCallback(
      (amount: number | undefined) => {
        void startPayment({ maxAmount: amount });
      },
      [startPayment]
    );

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setUseDefaultOnOpen(false);
          bottomSheetRef.current?.snapToIndex(0);
        },
        openWithDefault: () => {
          setUseDefaultOnOpen(true);
          bottomSheetRef.current?.snapToIndex(0);
          // Start payment after sheet opens - don't rely on onChange
          setTimeout(() => {
            const amount =
              defaultMaxAmount === NO_LIMIT ? undefined : defaultMaxAmount;
            handleSelectAmount(amount);
          }, 100);
        },
        close: () => {
          bottomSheetRef.current?.close();
        },
      }),
      [defaultMaxAmount, handleSelectAmount]
    );

    const handleCancel = useCallback(() => {
      cancelPayment();
      setUseDefaultOnOpen(false);
      bottomSheetRef.current?.close();
      onClose?.();
    }, [cancelPayment, onClose]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      ),
      []
    );

    const isDefault = (amount: number | undefined) =>
      amount === undefined
        ? defaultMaxAmount === NO_LIMIT
        : defaultMaxAmount === amount;

    const renderRow = (
      amount: number | undefined,
      label: string,
      sublabel?: string,
      isLast = false
    ) => (
      <View key={amount ?? "no-limit"}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleSelectAmount(amount)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, { color: color.TEXT }]}>{label}</Text>
          <View style={styles.rowRight}>
            {sublabel && (
              <Text style={[styles.sublabel, { color: color.TEXT_SECONDARY }]}>
                {sublabel}
              </Text>
            )}
            {isDefault(amount) && (
              <View style={[styles.badge, { backgroundColor: hi[highlight] }]}>
                <Text style={styles.badgeText}>
                  {t("default", { defaultValue: "Default" })}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {!isLast && <Separator style={styles.separator} />}
      </View>
    );

    const showAmountSelection = !isActive && !useDefaultOnOpen;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose={!isActive}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.BACKGROUND }}
        handleIndicatorStyle={{ backgroundColor: color.TEXT_SECONDARY }}
      >
        <BottomSheetScrollView
          style={{ backgroundColor: color.BACKGROUND }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <NfcIcon width={s(28)} color={hi[highlight]} />
            <Txt
              txt={
                showAmountSelection
                  ? t("nfcSelectMaxAmount", {
                      ns: NS.wallet,
                      defaultValue: "Select maximum amount",
                    })
                  : t("nfcPayment", {
                      ns: NS.wallet,
                      defaultValue: "NFC Payment",
                    })
              }
              bold
              styles={[styles.title]}
            />
          </View>

          {showAmountSelection && (
            <View
              style={[
                styles.list,
                { backgroundColor: color.INPUT_BG, borderColor: color.BORDER },
              ]}
            >
              {renderRow(
                undefined,
                t("noLimit", { ns: NS.wallet, defaultValue: "No limit" })
              )}
              {customAmounts.map((amount, i) => {
                const fiat =
                  formatBalance && rates ? formatSatsAsCurrency(amount) : null;
                return renderRow(
                  amount,
                  `${amount.toLocaleString()} sats`,
                  fiat ? `≈ ${currencySymbol}${fiat}` : undefined,
                  i === customAmounts.length - 1
                );
              })}
            </View>
          )}

          {!showAmountSelection && (
            <View style={styles.loading}>
              <View style={[styles.pulse, { borderColor: hi[highlight] }]}>
                <NfcIcon width={s(40)} color={hi[highlight]} />
              </View>
              <Txt
                txt={statusMessage}
                styles={[{ color: color.TEXT_SECONDARY }]}
              />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

NfcPaymentModal.displayName = "NfcPaymentModal";

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "16@vs",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "10@s",
    marginBottom: "16@vs",
    marginTop: "4@vs",
  },
  title: {
    fontSize: "18@vs",
  },
  list: {
    borderRadius: "12@s",
    borderWidth: 1,
    marginBottom: "8@vs",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: "12@vs",
    paddingHorizontal: "14@s",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: "8@s",
  },
  label: {
    fontSize: "14@vs",
    fontWeight: "500",
  },
  sublabel: {
    fontSize: "12@vs",
  },
  badge: {
    paddingHorizontal: "6@s",
    paddingVertical: "2@vs",
    borderRadius: "4@s",
  },
  badgeText: {
    fontSize: "9@vs",
    color: "#fff",
    fontWeight: "600",
  },
  separator: {
    marginHorizontal: "14@s",
  },
  loading: {
    alignItems: "center",
    paddingVertical: "32@vs",
  },
  pulse: {
    width: "80@s",
    height: "80@s",
    borderRadius: "40@s",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "16@vs",
  },
});

export default NfcPaymentModal;
