import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ScrollView, Text, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import Button from "@comps/Button";

export type ConfirmBottomSheetRef = {
  open: (options: {
    header: string;
    txt: string;
    confirmTxt: string;
    cancelTxt: string;
    onConfirm: () => void;
    onCancel?: () => void;
    destructive?: boolean;
  }) => void;
  close: () => void;
};

interface SheetOptions {
  header: string;
  txt: string;
  confirmTxt: string;
  cancelTxt: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

const ConfirmBottomSheet = forwardRef<ConfirmBottomSheetRef>((_, ref) => {
  const { color, highlight } = useThemeContext();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<TrueSheet>(null);
  const notifyCancelOnDismissRef = useRef(false);
  const [options, setOptions] = useState<SheetOptions | null>(null);

  const close = useCallback((closeOptions?: { notifyCancel?: boolean }) => {
    notifyCancelOnDismissRef.current = closeOptions?.notifyCancel ?? false;
    void sheetRef.current?.dismiss();
  }, []);

  const open = useCallback((newOptions: SheetOptions) => {
    setOptions(newOptions);
    notifyCancelOnDismissRef.current = false;
    setTimeout(() => {
      try {
        void sheetRef.current?.present();
      } catch {
        /* ignore */
      }
    }, 0);
  }, []);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    close();
  }, [options, close]);

  const handleCancel = useCallback(() => {
    close({ notifyCancel: true });
  }, [close]);

  const handleDismiss = useCallback(() => {
    const shouldNotifyCancel = notifyCancelOnDismissRef.current;
    notifyCancelOnDismissRef.current = false;

    if (shouldNotifyCancel && options?.onCancel) {
      options.onCancel();
    }
  }, [options]);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      dismissible={false}
      draggable={false}
      backgroundColor={color.BACKGROUND}
      cornerRadius={s(26)}
      grabberOptions={{ color: color.TEXT_SECONDARY }}
      onDidDismiss={handleDismiss}
    >
      <ScrollView
        style={{ backgroundColor: color.BACKGROUND }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, vs(20)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {options && (
          <>
            <Text style={[globals(color, highlight).modalHeader, { marginBottom: vs(15) }]}>
              {options.header}
            </Text>
            <Text style={[styles.message, { color: color.TEXT }]}>{options.txt}</Text>
            <View style={styles.buttonContainer}>
              <Button
                txt={options.confirmTxt}
                onPress={handleConfirm}
                outlined={!options.destructive}
                destructive={options.destructive}
              />
              <Button txt={options.cancelTxt} onPress={handleCancel} outlined />
            </View>
          </>
        )}
      </ScrollView>
    </TrueSheet>
  );
});

ConfirmBottomSheet.displayName = "ConfirmBottomSheet";

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "20@s",
    paddingTop: "30@vs",
  },
  message: {
    fontSize: "14@vs",
    marginBottom: "20@vs",
    lineHeight: "20@vs",
  },
  buttonContainer: {
    width: "100%",
    gap: "10@vs",
  },
});

export default ConfirmBottomSheet;
