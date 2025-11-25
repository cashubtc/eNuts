import Button from "@comps/Button";
import RadioBtn from "@comps/RadioBtn";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Toggle from "@comps/Toggle";
import Txt from "@comps/Txt";
import type { TCurrencySettingsPageProps } from "@model/nav";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import type { TCurrencyCode } from "@model";
import { globals, mainColors } from "@styles";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

// Common currencies to display at the top
const COMMON_CURRENCIES: TCurrencyCode[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "CNY",
];

export default function CurrencySettings({
  navigation,
}: TCurrencySettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
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
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: mainColors.ERROR },
            ]}
          >
            <Txt txt={t("ratesUnavailable")} styles={[styles.errorText]} />
            <Txt
              txt={t("ratesUnavailableDesc")}
              styles={[styles.errorDescription]}
            />
            <Button
              txt={t("retry")}
              onPress={handleRetry}
              outlined
              loading={isLoading}
            />
          </View>
        )}

        {/* Enable Currency Conversion Toggle */}
        <Txt txt={t("currencyConversion")} bold styles={[styles.subHeader]} />
        <View style={globals(color).wrapContainer}>
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
                    color: ratesUnavailable ? color.TEXT_SECONDARY : color.TEXT,
                  },
                ]}
              />
              <Txt
                txt={
                  ratesUnavailable
                    ? t("ratesRequiredForFiat")
                    : t("showFiatBalanceDesc")
                }
                styles={[styles.description, { color: color.TEXT_SECONDARY }]}
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
              styles={[styles.lastUpdate, { color: color.TEXT_SECONDARY }]}
            />
          )}
        </View>

        {isLoading && !rates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.TEXT} />
            <Txt
              txt={t("loadingRates")}
              styles={[styles.loadingText, { color: color.TEXT_SECONDARY }]}
            />
          </View>
        ) : hasRatesError ? (
          <View style={[globals(color).wrapContainer, styles.emptyContainer]}>
            <Txt
              txt={t("noCurrenciesAvailable")}
              styles={[styles.emptyText, { color: color.TEXT_SECONDARY }]}
            />
          </View>
        ) : (
          <View style={[globals(color).wrapContainer, { marginBottom: s(80) }]}>
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
  const { color } = useThemeContext();

  return (
    <>
      <TouchableOpacity
        style={[globals().wrapRow, { paddingBottom: vs(15) }]}
        onPress={() => onSelect(code)}
        disabled={disabled}
      >
        <View style={styles.currencyInfo}>
          <Txt
            txt={code}
            bold
            styles={[{ color: disabled ? color.TEXT_SECONDARY : color.TEXT }]}
          />
          <Txt
            txt={symbol}
            styles={[
              styles.currencySymbol,
              { color: disabled ? color.TEXT_SECONDARY : color.TEXT_SECONDARY },
            ]}
          />
        </View>
        <RadioBtn selected={selected} />
      </TouchableOpacity>
      {hasSeparator && <Separator style={[{ marginBottom: vs(15) }]} />}
    </>
  );
}

const styles = ScaledSheet.create({
  subHeader: {
    paddingHorizontal: "20@s",
    marginBottom: "10@vs",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "15@vs",
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: "16@s",
  },
  toggleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: "12@s",
    marginTop: "4@vs",
  },
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: "20@s",
  },
  lastUpdate: {
    fontSize: "11@s",
  },
  loadingContainer: {
    padding: "40@s",
    alignItems: "center",
  },
  loadingText: {
    marginTop: "12@vs",
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    marginLeft: "12@s",
    fontSize: "14@s",
  },
  errorContainer: {
    marginHorizontal: "20@s",
    marginBottom: "16@vs",
    padding: "16@s",
    borderRadius: "12@s",
    alignItems: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: "14@s",
    marginBottom: "4@vs",
  },
  errorDescription: {
    color: "#FFFFFF",
    fontSize: "12@s",
    textAlign: "center",
    marginBottom: "12@vs",
    opacity: 0.9,
  },
  emptyContainer: {
    padding: "40@s",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
