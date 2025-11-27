import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import ConfirmBottomSheet, {
  type ConfirmBottomSheetRef,
} from "@comps/modal/ConfirmBottomSheet";
import AddAmountBottomSheet, {
  type AddAmountBottomSheetRef,
} from "@comps/modal/AddAmountBottomSheet";
import { NfcIcon } from "@comps/Icons";
import {
  useNfcAmountLimitsContext,
  NO_LIMIT,
} from "@src/context/NfcAmountLimits";
import type { TNfcSettingsPageProps } from "@src/nav/navTypes";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import Button from "@comps/Button";

export default function NfcSettings({ navigation }: TNfcSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const { formatBalance, formatSatsAsCurrency, rates, selectedCurrency } =
    useCurrencyContext();

  const confirmSheetRef = useRef<ConfirmBottomSheetRef>(null);
  const addAmountSheetRef = useRef<AddAmountBottomSheetRef>(null);

  const {
    defaultMaxAmount,
    customAmounts,
    isLoading,
    addAmount,
    selectDefault,
    removeAmount,
    resetToDefaults,
  } = useNfcAmountLimitsContext();

  // Get currency symbol for display
  const currencySymbol = rates?.[selectedCurrency]?.symbol || selectedCurrency;

  // Open add amount sheet
  const handleAddLimit = useCallback(() => {
    addAmountSheetRef.current?.open();
  }, []);

  // Long press handler - opens confirmation dialog
  const handleLongPressAmount = useCallback(
    (amount: number) => {
      // Don't allow removing the last amount
      if (customAmounts.length <= 1) return;

      confirmSheetRef.current?.open({
        header: t("deleteAmount", { defaultValue: "Delete Amount" }),
        txt: t("deleteAmountConfirm", {
          defaultValue: `Are you sure you want to remove ${amount.toLocaleString()} sats from your quick select amounts?`,
          amount: amount.toLocaleString(),
        }),
        confirmTxt: t("delete", { defaultValue: "Delete" }),
        cancelTxt: t("cancel"),
        destructive: true,
        onConfirm: () => void removeAmount(amount),
      });
    },
    [customAmounts.length, removeAmount, t]
  );

  const formatAmount = (amount: number) => {
    if (amount === NO_LIMIT) return "∞";
    return amount.toLocaleString();
  };

  const getFiatValue = (amount: number) => {
    if (!formatBalance || !rates || amount === NO_LIMIT) return null;
    return formatSatsAsCurrency(amount);
  };

  if (isLoading) {
    return (
      <Screen
        screenName={t("nfcSettings", {
          ns: NS.topNav,
          defaultValue: "NFC Settings",
        })}
        withBackBtn
        handlePress={() => navigation.goBack()}
      >
        <View style={styles.loadingContainer}>
          <Txt txt="Loading..." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      screenName={t("nfcSettings", {
        ns: NS.topNav,
        defaultValue: "NFC Settings",
      })}
      withBackBtn
      handlePress={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          style={{ paddingHorizontal: 20 }}
          onPress={handleAddLimit}
        >
          <Txt txt="Add Limit" styles={[{ color: hi[highlight] }]} />
        </TouchableOpacity>
      }
    >
      <ScrollView
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with NFC icon */}
        <View style={styles.headerContainer}>
          <NfcIcon width={s(40)} color={hi[highlight]} />
          <Txt
            txt={t("nfcPaymentLimits", { defaultValue: "Payment Limits" })}
            bold
            styles={[styles.headerTitle]}
          />
          <Txt
            txt={t("nfcPaymentLimitsDesc", {
              defaultValue:
                "Set default and custom amount limits for NFC tap-to-pay",
            })}
            styles={[styles.headerSubtitle, { color: color.TEXT_SECONDARY }]}
          />
        </View>

        {/* Amount Limits Section */}
        <Txt
          txt={t("amountLimits", { defaultValue: "Amount Limits" })}
          bold
          styles={[styles.subHeader]}
        />
        <Txt
          txt={t("amountLimitsDesc", {
            defaultValue: "Tap to set as default, long press to delete",
          })}
          styles={[styles.subHeaderDesc, { color: color.TEXT_SECONDARY }]}
        />

        <View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
          {/* No Limit option */}
          <TouchableOpacity
            style={[globals().wrapRow, { paddingBottom: vs(15) }]}
            onPress={() => selectDefault(NO_LIMIT)}
          >
            <View style={styles.amountInfo}>
              <Text style={[styles.amountText, { color: color.TEXT }]}>
                {t("noLimit", { defaultValue: "No Limit" })}
              </Text>
              <Text
                style={[styles.amountDesc, { color: color.TEXT_SECONDARY }]}
              >
                {t("noLimitDesc", { defaultValue: "Confirm any amount" })}
              </Text>
            </View>
            <RadioBtn selected={defaultMaxAmount === NO_LIMIT} />
          </TouchableOpacity>

          <Separator style={[{ marginBottom: vs(15) }]} />

          {/* Amount list */}
          {customAmounts.map((amount, i) => {
            const fiatValue = getFiatValue(amount);
            const isSelected = defaultMaxAmount === amount;
            return (
              <View key={amount}>
                <TouchableOpacity
                  style={[globals().wrapRow, { paddingBottom: vs(15) }]}
                  onPress={() => selectDefault(amount)}
                  onLongPress={() => handleLongPressAmount(amount)}
                  delayLongPress={400}
                >
                  <View style={styles.amountInfo}>
                    <Text style={[styles.amountText, { color: color.TEXT }]}>
                      {formatAmount(amount)} sats
                    </Text>
                    {fiatValue && (
                      <Text
                        style={[
                          styles.amountDesc,
                          { color: color.TEXT_SECONDARY },
                        ]}
                      >
                        ≈ {currencySymbol}
                        {fiatValue}
                      </Text>
                    )}
                  </View>
                  <RadioBtn selected={isSelected} />
                </TouchableOpacity>
                {i !== customAmounts.length - 1 && (
                  <Separator style={[{ marginBottom: vs(15) }]} />
                )}
              </View>
            );
          })}
        </View>

        <Button
          txt={t("resetToDefaults", { defaultValue: "Reset to Defaults" })}
          onPress={resetToDefaults}
          outlined
        />
      </ScrollView>

      {/* Confirmation Bottom Sheet */}
      <ConfirmBottomSheet ref={confirmSheetRef} />

      {/* Add Amount Bottom Sheet */}
      <AddAmountBottomSheet
        ref={addAmountSheetRef}
        onConfirm={addAmount}
        existingAmounts={customAmounts}
      />
    </Screen>
  );
}

const styles = ScaledSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: "20@vs",
    paddingHorizontal: "20@s",
  },
  headerTitle: {
    fontSize: "20@vs",
    marginTop: "12@vs",
  },
  headerSubtitle: {
    fontSize: "14@vs",
    marginTop: "8@vs",
    textAlign: "center",
  },
  subHeader: {
    paddingHorizontal: "20@s",
    marginBottom: "4@vs",
  },
  subHeaderDesc: {
    paddingHorizontal: "20@s",
    marginBottom: "10@vs",
    fontSize: "12@vs",
  },
  amountInfo: {
    flex: 1,
  },
  amountText: {
    fontSize: "15@vs",
    fontWeight: "500",
  },
  amountDesc: {
    fontSize: "12@vs",
    marginTop: "2@vs",
  },
  resetButton: {
    alignItems: "center",
    paddingVertical: "12@vs",
    marginBottom: "80@vs",
  },
});
