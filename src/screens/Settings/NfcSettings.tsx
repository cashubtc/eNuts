import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import {
  useNfcAmountLimitsContext,
  NO_LIMIT,
} from "@src/context/NfcAmountLimits";
import type { TNfcSettingsPageProps } from "@src/nav/navTypes";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  TextInput,
} from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function NfcSettings({ navigation }: TNfcSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const { formatBalance, formatSatsAsCurrency, rates, selectedCurrency } =
    useCurrencyContext();

  const { defaultMaxAmount, isLoading, setDefaultMaxAmount } =
    useNfcAmountLimitsContext();

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
    [formatBalance, rates, formatSatsAsCurrency]
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
      await setDefaultMaxAmount(50_000);
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
    [hasNoLimit, setDefaultMaxAmount]
  );

  const currentAmount = parseInt(inputValue, 10);
  const fiatValue = !isNaN(currentAmount) ? getFiatValue(currentAmount) : null;

  // Format display value with thousand separators
  const displayValue = !isNaN(currentAmount)
    ? currentAmount.toLocaleString()
    : "50,000";

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
    >
      <ScrollView alwaysBounceVertical={false}>
        <Txt
          txt={t("paymentLimit", { defaultValue: "Payment Limit" })}
          bold
          styles={[styles.subHeader]}
        />

        <View style={globals(color).wrapContainer}>
          {/* No Limit option */}
          <TouchableOpacity
            style={[globals().wrapRow, { paddingBottom: s(15) }]}
            onPress={handleSelectNoLimit}
          >
            <Txt txt={t("noLimit", { defaultValue: "No Limit" })} />
            <RadioBtn selected={hasNoLimit} />
          </TouchableOpacity>

          <Separator style={[{ marginBottom: s(15) }]} />

          {/* Custom Limit option */}
          <TouchableOpacity
            style={[globals().wrapRow]}
            onPress={handleSelectCustomLimit}
          >
            <View style={styles.customLimitRow}>
              <Txt txt={t("customLimit", { defaultValue: "Custom" })} />
              {!hasNoLimit && (
                <View style={styles.valueContainer}>
                  <TextInput
                    ref={inputRef}
                    value={inputValue}
                    onChangeText={handleInputChange}
                    keyboardType="number-pad"
                    style={[styles.inlineInput, { color: hi[highlight] }]}
                    selectionColor={hi[highlight]}
                    returnKeyType="done"
                  />
                  <Text
                    style={[styles.satsLabel, { color: color.TEXT_SECONDARY }]}
                  >
                    sats
                  </Text>
                </View>
              )}
            </View>
            <RadioBtn selected={!hasNoLimit} />
          </TouchableOpacity>

          {/* Fiat value hint */}
          {!hasNoLimit && fiatValue && (
            <Text style={[styles.fiatHint, { color: color.TEXT_SECONDARY }]}>
              ≈ {currencySymbol}
              {fiatValue}
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subHeader: {
    paddingHorizontal: "20@s",
    marginBottom: "10@vs",
  },
  customLimitRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: "10@s",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineInput: {
    fontSize: "15@vs",
    fontWeight: "500",
    padding: 0,
    minWidth: "60@s",
  },
  satsLabel: {
    fontSize: "13@vs",
    marginLeft: "4@s",
  },
  fiatHint: {
    fontSize: "12@vs",
    marginTop: "8@vs",
    marginLeft: "70@s",
  },
});
