import Button from "@comps/Button";
import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Toggle from "@comps/Toggle";
import Txt from "@comps/Txt";
import type { TCurrencySettingsPageProps } from "@model/nav";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import type { TCurrencyCode } from "@model";
import { fontScale, globals, useAppThemeTokens } from "@styles";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, TouchableOpacity, View, StyleSheet } from "react-native";

// Common currencies to display at the top
const COMMON_CURRENCIES: TCurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY"];

export default function CurrencySettings({ navigation }: TCurrencySettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const {
    rates,
    selectedCurrency,
    setSelectedCurrency,
    formatBalance,
    setFormatBalance,
    isLoading,
    lastUpdate,
    error,
    refreshRates,
  } = useCurrencyContext();

  // Determine if rates are unavailable (error state)
  const hasRatesError = !isLoading && !rates && !!error;
  const ratesUnavailable = !rates;

  // Sort currencies: common ones first, then alphabetically
  const sortedCurrencies = rates
    ? Object.keys(rates).sort((a, b) => {
        const aIsCommon = COMMON_CURRENCIES.includes(a);
        const bIsCommon = COMMON_CURRENCIES.includes(b);
        if (aIsCommon && !bIsCommon) return -1;
        if (!aIsCommon && bIsCommon) return 1;
        if (aIsCommon && bIsCommon) {
          return COMMON_CURRENCIES.indexOf(a) - COMMON_CURRENCIES.indexOf(b);
        }
        return a.localeCompare(b);
      })
    : [];

  const handleCurrencySelect = async (currency: TCurrencyCode) => {
    // Don't allow selection if rates are unavailable
    if (ratesUnavailable) return;
    await setSelectedCurrency(currency);
  };

  const handleToggleFormatBalance = async () => {
    // Don't allow toggle if rates are unavailable
    if (ratesUnavailable) return;
    await setFormatBalance(!formatBalance);
  };

  const handleRetry = async () => {
    await refreshRates();
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "";
    const date = new Date(lastUpdate);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Screen
      screenName={t("currency", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView alwaysBounceVertical={false}>
        {/* Error Banner */}
        {hasRatesError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error }]}>
            <Txt txt={t("ratesUnavailable")} styles={[styles.errorText, { color: theme.white }]} />
            <Txt
              txt={t("ratesUnavailableDesc")}
              styles={[styles.errorDescription, { color: theme.white }]}
            />
            <Button txt={t("retry")} onPress={handleRetry} outlined loading={isLoading} />
          </View>
        )}

        {/* Enable Currency Conversion Toggle */}
        <Txt txt={t("currencyConversion")} bold styles={[styles.subHeader]} />
        <View style={(globals().wrapContainer, { backgroundColor: theme.drawer })}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={handleToggleFormatBalance}
            disabled={ratesUnavailable}
          >
            <View style={styles.toggleTextContainer}>
              <Txt
                txt={t("showFiatBalance")}
                styles={[
                  {
                    color: ratesUnavailable ? theme.textSecondary : theme.text,
                  },
                ]}
              />
              <Txt
                txt={ratesUnavailable ? t("ratesRequiredForFiat") : t("showFiatBalanceDesc")}
                styles={[styles.description, { color: theme.textSecondary }]}
              />
            </View>
            <View style={styles.toggleContainer}>
              <Toggle
                value={formatBalance}
                onChange={handleToggleFormatBalance}
                disabled={ratesUnavailable}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Currency Selection */}
        <View style={styles.currencyHeader}>
          <Txt txt={t("selectCurrency")} bold styles={[styles.subHeader]} />
          {lastUpdate && (
            <Txt
              txt={`${t("lastUpdate")}: ${formatLastUpdate()}`}
              styles={[styles.lastUpdate, { color: theme.textSecondary }]}
            />
          )}
        </View>

        {isLoading && !rates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.text} />
            <Txt
              txt={t("loadingRates")}
              styles={[styles.loadingText, { color: theme.textSecondary }]}
            />
          </View>
        ) : hasRatesError ? (
          <View
            style={[
              globals().wrapContainer,
              { backgroundColor: theme.drawer },
              styles.emptyContainer,
            ]}
          >
            <Txt
              txt={t("noCurrenciesAvailable")}
              styles={[styles.emptyText, { color: theme.textSecondary }]}
            />
          </View>
        ) : (
          <View
            style={[
              globals().wrapContainer,
              { backgroundColor: theme.drawer },
              { marginBottom: 80 },
            ]}
          >
            {sortedCurrencies.map((currency, i) => (
              <CurrencySelection
                key={currency}
                code={currency}
                symbol={rates?.[currency]?.symbol || currency}
                selected={currency === selectedCurrency}
                hasSeparator={i !== sortedCurrencies.length - 1}
                onSelect={handleCurrencySelect}
                disabled={!formatBalance || ratesUnavailable}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

interface ICurrencySelectionProps {
  code: TCurrencyCode;
  symbol: string;
  selected: boolean;
  hasSeparator?: boolean;
  onSelect: (code: TCurrencyCode) => void;
  disabled?: boolean;
}

function CurrencySelection({
  code,
  symbol,
  selected,
  hasSeparator,
  onSelect,
  disabled,
}: ICurrencySelectionProps) {
  const theme = useAppThemeTokens();

  return (
    <>
      <TouchableOpacity
        style={[globals().wrapRow, { paddingBottom: 15 }]}
        onPress={() => onSelect(code)}
        disabled={disabled}
      >
        <View style={styles.currencyInfo}>
          <Txt txt={code} bold styles={[{ color: disabled ? theme.textSecondary : theme.text }]} />
          <Txt
            txt={symbol}
            styles={[
              styles.currencySymbol,
              { color: disabled ? theme.textSecondary : theme.textSecondary },
            ]}
          />
        </View>
        <RadioBtn selected={selected} />
      </TouchableOpacity>
      {hasSeparator && <Separator style={[{ marginBottom: 15 }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  subHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 15,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: fontScale(12),
    marginTop: 4,
  },
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  lastUpdate: {
    fontSize: fontScale(11),
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    marginLeft: 12,
    fontSize: fontScale(14),
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  errorText: {
    fontWeight: "600",
    fontSize: fontScale(14),
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: fontScale(12),
    textAlign: "center",
    marginBottom: 12,
    opacity: 0.9,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
