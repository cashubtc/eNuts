import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import { useNfcAmountLimitsContext, NO_LIMIT } from "@src/context/NfcAmountLimits";
import type { TNfcSettingsPageProps } from "@src/nav/navTypes";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import {
  AppText,
  appFontSize,
  globals,
  InputFrame,
  PressableSurface,
  useAppThemeTokens,
  Stack,
} from "@styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, type TextInput, StyleSheet } from "react-native";
export default function NfcSettings({ navigation }: TNfcSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { formatBalance, formatSatsAsCurrency, rates, selectedCurrency } = useCurrencyContext();
  const { defaultMaxAmount, isLoading, setDefaultMaxAmount } = useNfcAmountLimitsContext();
  const inputRef = useRef<TextInput>(null);
  const [inputValue, setInputValue] = useState("");
  const hasNoLimit = defaultMaxAmount === NO_LIMIT;
  const currencySymbol = rates?.[selectedCurrency]?.symbol || selectedCurrency;
  // Sync local state with context when it loads
  useEffect(() => {
    if (!isLoading && defaultMaxAmount !== NO_LIMIT) {
      setInputValue(defaultMaxAmount.toString());
    }
  }, [isLoading, defaultMaxAmount]);
  // Get fiat value for display
  const getFiatValue = useCallback(
    (amount: number) => {
      if (!formatBalance || !rates || amount <= 0) return null;
      return formatSatsAsCurrency(amount);
    },
    [formatBalance, rates, formatSatsAsCurrency],
  );
  // Handle selecting "No Limit"
  const handleSelectNoLimit = useCallback(async () => {
    await setDefaultMaxAmount(NO_LIMIT);
  }, [setDefaultMaxAmount]);
  // Handle selecting "Custom Limit"
  const handleSelectCustomLimit = useCallback(async () => {
    const amount = parseInt(inputValue, 10);
    if (!isNaN(amount) && amount > 0) {
      await setDefaultMaxAmount(amount);
    } else {
      setInputValue("50000");
      await setDefaultMaxAmount(50000);
    }
    // Focus the input when selecting custom limit
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputValue, setDefaultMaxAmount]);
  // Handle input change
  const handleInputChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      setInputValue(cleaned);
      if (!hasNoLimit) {
        const amount = parseInt(cleaned, 10);
        if (!isNaN(amount) && amount > 0) {
          void setDefaultMaxAmount(amount);
        }
      }
    },
    [hasNoLimit, setDefaultMaxAmount],
  );
  const currentAmount = parseInt(inputValue, 10);
  const fiatValue = !isNaN(currentAmount) ? getFiatValue(currentAmount) : null;
  // Format display value with thousand separators
  const displayValue = !isNaN(currentAmount) ? currentAmount.toLocaleString() : "50,000";
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
        <Stack style={styles.loadingContainer}>
          <AppText testID={"Loading...-txt"}>Loading...</AppText>
        </Stack>
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
    >
      <ScrollView alwaysBounceVertical={false}>
        <AppText
          style={[styles.subHeader]}
          weight="medium"
          testID={`${t("paymentLimit", { defaultValue: "Payment Limit" })}-txt`}
        >
          {t("paymentLimit", { defaultValue: "Payment Limit" })}
        </AppText>

        <Stack style={[globals().wrapContainer, { backgroundColor: theme.drawer }]}>
          {/* No Limit option */}
          <PressableSurface
            style={[globals().wrapRow, { paddingBottom: 15 }]}
            onPress={handleSelectNoLimit}
          >
            <AppText testID={`${t("noLimit", { defaultValue: "No Limit" })}-txt`}>
              {t("noLimit", { defaultValue: "No Limit" })}
            </AppText>
            <RadioBtn selected={hasNoLimit} />
          </PressableSurface>

          <Separator style={[{ marginBottom: 15 }]} />

          {/* Custom Limit option */}
          <PressableSurface style={[globals().wrapRow]} onPress={handleSelectCustomLimit}>
            <Stack style={styles.customLimitRow}>
              <AppText testID={`${t("customLimit", { defaultValue: "Custom" })}-txt`}>
                {t("customLimit", { defaultValue: "Custom" })}
              </AppText>
              {!hasNoLimit && (
                <Stack style={styles.valueContainer}>
                  <InputFrame
                    ref={inputRef}
                    value={inputValue}
                    onChangeText={handleInputChange}
                    keyboardType="number-pad"
                    style={[styles.inlineInput, { color: theme.accent }]}
                    selectionColor={theme.accent}
                    cursorColor={theme.accent}
                    returnKeyType="done"
                  />
                  <AppText style={[styles.satsLabel, { color: theme.textSecondary }]}>sats</AppText>
                </Stack>
              )}
            </Stack>
            <RadioBtn selected={!hasNoLimit} />
          </PressableSurface>

          {/* Fiat value hint */}
          {!hasNoLimit && fiatValue && (
            <AppText style={[styles.fiatHint, { color: theme.textSecondary }]}>
              ≈ {currencySymbol}
              {fiatValue}
            </AppText>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  customLimitRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineInput: {
    fontSize: appFontSize.bodyMedium,
    fontWeight: "500",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 60,
    width: 72,
  },
  satsLabel: {
    fontSize: appFontSize.bodySmall,
    marginLeft: 4,
  },
  fiatHint: {
    fontSize: appFontSize.caption,
    marginTop: 8,
    marginLeft: 70,
  },
});
