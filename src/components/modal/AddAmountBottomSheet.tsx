import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";
import { ScaledSheet, vs, s } from "react-native-size-matters";
import { useThemeContext } from "@src/context/Theme";
import { globals, highlight as hi } from "@styles";
import Button from "@comps/Button";

export type AddAmountBottomSheetRef = {
  open: () => void;
  close: () => void;
};

interface AddAmountBottomSheetProps {
  onConfirm: (amount: number) => Promise<boolean>;
  existingAmounts: number[];
}

const AddAmountBottomSheet = forwardRef<
  AddAmountBottomSheetRef,
  AddAmountBottomSheetProps
>(({ onConfirm, existingAmounts }, ref) => {
  const { color, highlight } = useThemeContext();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
    setInputValue("");
    setError(null);
  }, []);

  const open = useCallback(() => {
    setInputValue("");
    setError(null);
    setTimeout(() => {
      try {
        sheetRef.current?.present();
      } catch {
        /* ignore */
      }
    }, 0);
  }, []);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const handleBackdrop = useCallback(
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

  const validateAndSubmit = useCallback(async () => {
    const numValue = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);

    if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (existingAmounts.includes(numValue)) {
      setError("This amount already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onConfirm(numValue);
      if (success) {
        close();
      } else {
        setError("Failed to add amount");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue, existingAmounts, onConfirm, close]);

  const handleInputChange = useCallback((text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    setInputValue(numericValue);
    setError(null);
  }, []);

  // Format the input value with thousand separators for display
  const formattedValue = inputValue
    ? parseInt(inputValue, 10).toLocaleString()
    : "";

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backdropComponent={handleBackdrop}
      backgroundStyle={{ backgroundColor: color.BACKGROUND }}
      handleIndicatorStyle={{ backgroundColor: color.TEXT_SECONDARY }}
      enableDismissOnClose
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView
        style={[styles.container, { backgroundColor: color.BACKGROUND }]}
      >
        <Text
          style={[
            globals(color, highlight).modalHeader,
            { marginBottom: vs(8) },
          ]}
        >
          Add Custom Limit
        </Text>
        <Text style={[styles.subtitle, { color: color.TEXT_SECONDARY }]}>
          Enter an amount in sats
        </Text>

        <View style={styles.inputContainer}>
          <BottomSheetTextInput
            style={[
              styles.input,
              {
                backgroundColor: color.INPUT_BG,
                color: color.TEXT,
                borderColor: error ? "#FF6B6B" : color.BORDER,
              },
            ]}
            placeholder="e.g. 25000"
            placeholderTextColor={color.INPUT_PH}
            keyboardType="numeric"
            value={formattedValue}
            onChangeText={handleInputChange}
            selectionColor={hi[highlight]}
            autoFocus
          />
          <Text style={[styles.satsLabel, { color: color.TEXT_SECONDARY }]}>
            sats
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            txt="Add Limit"
            onPress={validateAndSubmit}
            disabled={!inputValue || isSubmitting}
            loading={isSubmitting}
          />
          <Button txt="Cancel" onPress={close} outlined />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

AddAmountBottomSheet.displayName = "AddAmountBottomSheet";

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@vs",
  },
  subtitle: {
    fontSize: "14@vs",
    marginBottom: "20@vs",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "8@vs",
  },
  input: {
    flex: 1,
    fontSize: "18@vs",
    fontWeight: "600",
    paddingHorizontal: "16@s",
    paddingVertical: "14@vs",
    borderRadius: "12@s",
    borderWidth: 1,
  },
  satsLabel: {
    fontSize: "16@vs",
    fontWeight: "500",
    marginLeft: "12@s",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: "12@vs",
    marginBottom: "12@vs",
  },
  buttonContainer: {
    width: "100%",
    gap: "10@vs",
    marginTop: "12@vs",
  },
});

export default AddAmountBottomSheet;

