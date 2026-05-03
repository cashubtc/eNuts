import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, verticalScale, fontScale, globals, useAppThemeTokens } from "@styles";
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
  const theme = useAppThemeTokens();
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
      backgroundColor={theme.background}
      cornerRadius={26}
      grabberOptions={{ color: theme.textSecondary }}
      onDidDismiss={handleDismiss}
    >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {options && (
          <>
            <AppText style={[globals().modalHeader, { color: theme.text }, { marginBottom: 15 }]}>
              {options.header}
            </AppText>
            <AppText style={[styles.message, { color: theme.text }]}>{options.txt}</AppText>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  message: {
    fontSize: fontScale(14),
    marginBottom: 20,
    lineHeight: verticalScale(20),
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
});

export default ConfirmBottomSheet;
