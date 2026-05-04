import Button from "@comps/Button";
import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Toggle from "@comps/Toggle";
import type { TCurrencySettingsPageProps } from "@model/nav";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import type { TCurrencyCode } from "@model";
import { AppText, fontScale, globals, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
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
          <Stack style={[styles.errorContainer, { backgroundColor: theme.error }]}>
            <AppText
              style={[styles.errorText, { color: theme.white }]}
              testID={`${t("ratesUnavailable")}-txt`}
            >
              {t("ratesUnavailable")}
            </AppText>
            <AppText
              style={[styles.errorDescription, { color: theme.white }]}
              testID={`${t("ratesUnavailableDesc")}-txt`}
            >
              {t("ratesUnavailableDesc")}
            </AppText>
            <Button txt={t("retry")} onPress={handleRetry} outlined loading={isLoading} />
          </Stack>
        )}

        {/* Enable Currency Conversion Toggle */}
        <AppText
          style={[styles.subHeader]}
          weight="medium"
          testID={`${t("currencyConversion")}-txt`}
        >
          {t("currencyConversion")}
        </AppText>
        <Stack style={(globals().wrapContainer, { backgroundColor: theme.drawer })}>
          <PressableSurface
            style={styles.toggleRow}
            onPress={handleToggleFormatBalance}
            disabled={ratesUnavailable}
          >
            <Stack style={styles.toggleTextContainer}>
              <AppText
                style={[
                  {
                    color: ratesUnavailable ? theme.textSecondary : theme.text,
                  },
                ]}
                testID={`${t("showFiatBalance")}-txt`}
              >
                {t("showFiatBalance")}
              </AppText>
              <AppText
                style={[styles.description, { color: theme.textSecondary }]}
                testID={`${ratesUnavailable ? t("ratesRequiredForFiat") : t("showFiatBalanceDesc")}-txt`}
              >
                {ratesUnavailable ? t("ratesRequiredForFiat") : t("showFiatBalanceDesc")}
              </AppText>
            </Stack>
            <Stack style={styles.toggleContainer}>
              <Toggle
                value={formatBalance}
                onChange={handleToggleFormatBalance}
                disabled={ratesUnavailable}
              />
            </Stack>
          </PressableSurface>
        </Stack>

        {/* Currency Selection */}
        <Stack style={styles.currencyHeader}>
          <AppText style={[styles.subHeader]} weight="medium" testID={`${t("selectCurrency")}-txt`}>
            {t("selectCurrency")}
          </AppText>
          {lastUpdate && (
            <AppText
              style={[styles.lastUpdate, { color: theme.textSecondary }]}
              testID={`${`${t("lastUpdate")}: ${formatLastUpdate()}`}-txt`}
            >{`${t("lastUpdate")}: ${formatLastUpdate()}`}</AppText>
          )}
        </Stack>

        {isLoading && !rates ? (
          <Stack style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.text} />
            <AppText
              style={[styles.loadingText, { color: theme.textSecondary }]}
              testID={`${t("loadingRates")}-txt`}
            >
              {t("loadingRates")}
            </AppText>
          </Stack>
        ) : hasRatesError ? (
          <Stack
            style={[
              globals().wrapContainer,
              { backgroundColor: theme.drawer },
              styles.emptyContainer,
            ]}
          >
            <AppText
              style={[styles.emptyText, { color: theme.textSecondary }]}
              testID={`${t("noCurrenciesAvailable")}-txt`}
            >
              {t("noCurrenciesAvailable")}
            </AppText>
          </Stack>
        ) : (
          <Stack
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
          </Stack>
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
      <PressableSurface
        style={[globals().wrapRow, { paddingBottom: 15 }]}
        onPress={() => onSelect(code)}
        disabled={disabled}
      >
        <Stack style={styles.currencyInfo}>
          <AppText
            style={[{ color: disabled ? theme.textSecondary : theme.text }]}
            weight="medium"
            testID={`${code}-txt`}
          >
            {code}
          </AppText>
          <AppText
            style={[
              styles.currencySymbol,
              { color: disabled ? theme.textSecondary : theme.textSecondary },
            ]}
            testID={`${symbol}-txt`}
          >
            {symbol}
          </AppText>
        </Stack>
        <RadioBtn selected={selected} />
      </PressableSurface>
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
