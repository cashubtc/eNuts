import { useShakeAnimation } from "@comps/animation/Shake";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatSatStr } from "@util";
import { useEffect, useMemo, useRef, forwardRef } from "react";
import { Animated, TextInput, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

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
    const { anim, shake } = useShakeAnimation();
    const internalRef = useRef<TextInput>(null);
    
    // Use the forwarded ref or fall back to internal ref
    const inputRef = (ref as React.RefObject<TextInput>) || internalRef;

  // Memoize style objects to prevent recreation
  const globalStyles = useMemo(() => globals(), []);

  // Derived numeric amount for display
  const amountValue = useMemo(() => {
    const parsed = parseInt(value || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [value]);

  // Handle amount changes - sanitize to numeric only
  const handleAmountChange = (text: string) => {
    const sanitized = text.replace(/\D/g, "");
    onChange(sanitized);
  };

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

    return (
      <View style={styles.container}>
        <Animated.View
          style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}
        >
          <TextInput
            keyboardType="numeric"
            ref={inputRef}
            placeholder={placeholder}
            autoFocus={autoFocus}
            cursorColor={hi[highlight]}
            placeholderTextColor={error ? mainColors.ERROR : hi[highlight]}
            style={[
              globalStyles.selectAmount,
              { color: error ? mainColors.ERROR : hi[highlight] },
            ]}
            onChangeText={handleAmountChange}
            onSubmitEditing={onSubmit}
            value={value}
            maxLength={maxLength}
            testID={testID}
          />
        </Animated.View>
        <Txt
          txt={formatSatStr(amountValue, "standard", false)}
          styles={[styles.sats, { color: color.TEXT_SECONDARY }]}
        />
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
  },
  amountWrap: {
    width: "100%",
    alignItems: "center",
  },
  sats: {
    fontSize: "12@vs",
    textAlign: "center",
    marginLeft: "-4@s",
    marginTop: "-5@vs",
  },
});

