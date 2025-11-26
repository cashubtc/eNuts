import { useShakeAnimation } from "@comps/animation/Shake";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatSatStr } from "@util";
import { getLanguageCode } from "@util/localization";
import {
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useState,
  useCallback,
} from "react";
import { Animated, TextInput, View, Pressable } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { SwapCurrencyIcon } from "@comps/Icons";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Detect the decimal separator for the current locale
 */
function getLocalDecimalSeparator(): string {
  const lang = getLanguageCode();
  const formatted = new Intl.NumberFormat(lang).format(1.1);
  // The decimal separator is the character between 1 and 1
  return formatted.charAt(1);
}

/**
 * Normalize a numeric string to use period as decimal separator
 * Handles both EU (comma) and US (period) formats intelligently
 */
function normalizeDecimalInput(input: string): string {
  // Remove all whitespace
  let text = input.replace(/\s/g, "");

  // If empty, return empty
  if (!text) return "";

  // Count separators
  const commas = (text.match(/,/g) || []).length;
  const periods = (text.match(/\./g) || []).length;

  // Case: Both separators present - last one is the decimal
  if (commas > 0 && periods > 0) {
    const lastComma = text.lastIndexOf(",");
    const lastPeriod = text.lastIndexOf(".");

    if (lastComma > lastPeriod) {
      // EU format: 1.000,50 -> 1000.50
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: 1,000.50 -> 1000.50
      text = text.replace(/,/g, "");
    }
  }
  // Case: Single comma, no periods - treat as decimal
  else if (commas === 1 && periods === 0) {
    text = text.replace(",", ".");
  }
  // Case: Multiple commas, no periods - thousand separators
  else if (commas > 1) {
    text = text.replace(/,/g, "");
  }
  // Case: Multiple periods - first ones are thousand separators, last is decimal
  else if (periods > 1) {
    const lastPeriodIdx = text.lastIndexOf(".");
    text =
      text.slice(0, lastPeriodIdx).replace(/\./g, "") +
      text.slice(lastPeriodIdx);
  }
  // Single period or no separators - already normalized

  return text;
}

/**
 * Format a number for display using the user's locale
 */
function formatFiatDisplay(value: number, decimals: number = 2): string {
  const lang = getLanguageCode();
  return value.toLocaleString(lang, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: false, // Don't add thousand separators in input
  });
}

const AmountInput = forwardRef<TextInput, AmountInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      error = false,
      placeholder = "0",
      maxLength = 8,
      autoFocus = true,
      testID = "amount-input",
    },
    ref
  ) => {
    const { color, highlight } = useThemeContext();
    const {
      formatBalance,
      setFormatBalance,
      convertFiatToSats,
      rates,
      selectedCurrency,
    } = useCurrencyContext();
    const { anim } = useShakeAnimation();
    const internalRef = useRef<TextInput>(null);

    // Use the forwarded ref or fall back to internal ref
    const inputRef = (ref as React.RefObject<TextInput>) || internalRef;

    // Check if we're in fiat mode
    const isFiatMode = formatBalance && rates && rates[selectedCurrency];

    // Check if currency toggle is available (rates must be loaded)
    const canToggleCurrency = rates && rates[selectedCurrency];

    // Handle toggling between sats and fiat modes
    const handleToggleCurrency = useCallback(() => {
      if (!canToggleCurrency) return;
      void setFormatBalance(!formatBalance);
    }, [canToggleCurrency, formatBalance, setFormatBalance]);

    // Store the displayed text independently to avoid cursor jumping
    // This is the raw text shown in the input field
    const [displayText, setDisplayText] = useState("");

    // Track if we need to sync display from external value change
    const lastExternalValue = useRef<string>("");

    // Memoize style objects to prevent recreation
    const globalStyles = useMemo(() => globals(), []);

    // Get the locale decimal separator for this user
    const localDecimalSep = useMemo(() => getLocalDecimalSeparator(), []);

    // Derived numeric amount in sats (value prop is always in sats)
    const amountInSats = useMemo(() => {
      const parsed = parseInt(value || "0", 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }, [value]);

    // Sync display text when external value changes (e.g., from parent reset)
    // But only if it wasn't caused by our own onChange
    useEffect(() => {
      // Skip if value hasn't changed from what we set
      if (value === lastExternalValue.current) {
        return;
      }

      // External value changed - need to update display
      if (!value || value === "0") {
        setDisplayText("");
        lastExternalValue.current = value;
        return;
      }

      // For sats mode, just show the value
      if (!isFiatMode) {
        setDisplayText(value);
        lastExternalValue.current = value;
        return;
      }

      // For fiat mode, convert sats to fiat for display
      const rate = rates?.[selectedCurrency];
      if (rate) {
        const sats = parseInt(value, 10);
        if (!isNaN(sats) && sats > 0) {
          const btcAmount = sats / 100_000_000;
          const fiatAmount = btcAmount * rate.last;
          // Format with locale-appropriate decimal separator
          const formatted = formatFiatDisplay(fiatAmount);
          setDisplayText(formatted);
        }
      }
      lastExternalValue.current = value;
    }, [value, isFiatMode, rates, selectedCurrency]);

    // Handle mode switches - reset display when switching between sats/fiat
    const prevFiatMode = useRef(isFiatMode);
    useEffect(() => {
      if (prevFiatMode.current !== isFiatMode) {
        // Mode changed - reset display text
        if (!value || value === "0") {
          setDisplayText("");
        } else if (!isFiatMode) {
          // Switched to sats mode - show sats value
          setDisplayText(value);
        } else {
          // Switched to fiat mode - convert sats to fiat
          const rate = rates?.[selectedCurrency];
          if (rate) {
            const sats = parseInt(value, 10);
            if (!isNaN(sats) && sats > 0) {
              const btcAmount = sats / 100_000_000;
              const fiatAmount = btcAmount * rate.last;
              setDisplayText(formatFiatDisplay(fiatAmount));
            }
          }
        }
        prevFiatMode.current = isFiatMode;
      }
    }, [isFiatMode, value, rates, selectedCurrency]);

    // Handle user input changes
    const handleAmountChange = useCallback(
      (text: string) => {
        // Handle empty input
        if (!text) {
          setDisplayText("");
          lastExternalValue.current = "0";
          onChange("0");
          return;
        }

        if (isFiatMode) {
          // Fiat mode: allow decimals

          // Only allow digits, commas, and periods
          let cleaned = text.replace(/[^\d.,]/g, "");

          // Handle leading decimal separator
          if (cleaned.startsWith(".") || cleaned.startsWith(",")) {
            cleaned = "0" + cleaned;
          }

          // Prevent multiple decimal separators of the same type
          // But allow typing either . or , as the decimal separator
          const normalized = normalizeDecimalInput(cleaned);

          // Check if the input is valid
          const parts = normalized.split(".");
          if (parts.length > 2) {
            // Invalid: multiple decimal points after normalization
            return;
          }

          // Limit decimal places to 2
          if (parts.length === 2 && parts[1].length > 2) {
            const truncatedDecimals = parts[1].substring(0, 2);
            // Reconstruct the display text with user's separator
            const userDecimalSep =
              text.includes(",") && !text.includes(".") ? "," : localDecimalSep;
            cleaned = parts[0] + userDecimalSep + truncatedDecimals;
          }

          // Update display immediately (no lag)
          setDisplayText(cleaned);

          // Convert to sats and notify parent
          const fiatValue = parseFloat(normalized || "0");
          if (!isNaN(fiatValue) && fiatValue >= 0) {
            const sats = convertFiatToSats(fiatValue);
            const satsStr = sats.toString();
            lastExternalValue.current = satsStr;
            onChange(satsStr);
          } else {
            lastExternalValue.current = "0";
            onChange("0");
          }
        } else {
          // Sats mode: integers only
          const cleaned = text.replace(/\D/g, "");
          // Remove leading zeros except for single "0"
          const sanitized = cleaned.replace(/^0+/, "") || "0";

          setDisplayText(sanitized === "0" ? "" : sanitized);
          lastExternalValue.current = sanitized;
          onChange(sanitized);
        }
      },
      [isFiatMode, convertFiatToSats, onChange, localDecimalSep]
    );

    // Auto-focus keyboard if requested
    useEffect(() => {
      if (autoFocus) {
        const t = setTimeout(() => {
          inputRef.current?.focus();
          clearTimeout(t);
        }, 200);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Currency symbol for fiat mode
    const currencySymbol = useMemo(() => {
      if (isFiatMode && rates?.[selectedCurrency]) {
        return rates[selectedCurrency].symbol || selectedCurrency;
      }
      return "";
    }, [isFiatMode, rates, selectedCurrency]);

    // Secondary label showing sats equivalent in fiat mode
    const secondaryLabel = useMemo(() => {
      if (!isFiatMode || amountInSats === 0) {
        return "";
      }
      return formatSatStr(amountInSats, "standard", true);
    }, [isFiatMode, amountInSats]);

    // Keyboard type
    const keyboardType = useMemo(
      () => (isFiatMode ? "decimal-pad" : "numeric"),
      [isFiatMode]
    );

    // Max length - allow more for fiat to accommodate decimals
    const effectiveMaxLength = useMemo(
      () => (isFiatMode ? 12 : maxLength),
      [isFiatMode, maxLength]
    );

    // Placeholder - show appropriate for mode
    const displayPlaceholder = useMemo(() => {
      if (isFiatMode) {
        return `0${localDecimalSep}00`;
      }
      return placeholder;
    }, [isFiatMode, placeholder, localDecimalSep]);

    return (
      <View style={styles.container}>
        <View style={styles.inputRow}>
          {/* Currency symbol prefix for fiat */}
          {currencySymbol && (
            <Txt
              txt={currencySymbol}
              styles={[
                styles.currencySymbol,
                {
                  color: error ? mainColors.ERROR : hi[highlight],
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.amountWrap,
              { transform: [{ translateX: anim.current }] },
            ]}
          >
            <TextInput
              keyboardType={keyboardType}
              ref={inputRef}
              placeholder={displayPlaceholder}
              autoFocus={autoFocus}
              cursorColor={hi[highlight]}
              placeholderTextColor={error ? mainColors.ERROR : hi[highlight]}
              style={[
                globalStyles.selectAmount,
                { color: error ? mainColors.ERROR : hi[highlight] },
              ]}
              onChangeText={handleAmountChange}
              onSubmitEditing={onSubmit}
              value={displayText}
              maxLength={effectiveMaxLength}
              testID={testID}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              returnKeyType="done"
              allowFontScaling={false}
            />
          </Animated.View>
          {/* Show "Sats" suffix when not in fiat mode */}
          {!isFiatMode && displayText && (
            <Txt
              txt="Sats"
              styles={[
                styles.satsSuffix,
                {
                  color: error ? mainColors.ERROR : hi[highlight],
                },
              ]}
            />
          )}
          {/* Currency toggle button */}
          {canToggleCurrency && (
            <Pressable
              onPress={handleToggleCurrency}
              style={({ pressed }) => [
                styles.toggleButton,
                {
                  backgroundColor: pressed ? color.INPUT_BG : "transparent",
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Toggle currency"
              accessibilityHint="Switch between sats and fiat currency"
            >
              <SwapCurrencyIcon width={20} height={20} color={hi[highlight]} />
            </Pressable>
          )}
        </View>
        {secondaryLabel && (
          <Pressable
            onPress={handleToggleCurrency}
            disabled={!canToggleCurrency}
          >
            <Txt
              txt={secondaryLabel}
              styles={[styles.secondaryLabel, { color: color.TEXT_SECONDARY }]}
            />
          </Pressable>
        )}
      </View>
    );
  }
);

AmountInput.displayName = "AmountInput";

export default AmountInput;

// Export the shake function for parent components to use
export { useShakeAnimation };

const styles = ScaledSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: "20@vs",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  amountWrap: {
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: "32@s",
    fontWeight: "600",
    marginRight: "4@s",
  },
  satsSuffix: {
    fontSize: "24@s",
    fontWeight: "500",
    marginLeft: "8@s",
    opacity: 0.8,
  },
  toggleButton: {
    marginLeft: "12@s",
    padding: "8@s",
    borderRadius: "20@s",
  },
  secondaryLabel: {
    fontSize: "14@vs",
    textAlign: "center",
    marginTop: "8@vs",
  },
});
