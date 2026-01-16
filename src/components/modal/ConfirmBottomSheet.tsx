import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<SheetOptions | null>(null);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const open = useCallback((newOptions: SheetOptions) => {
    setOptions(newOptions);
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
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    [],
  );

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    close();
  }, [options, close]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    close();
  }, [options, close]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backdropComponent={handleBackdrop}
      backgroundStyle={{ backgroundColor: color.BACKGROUND }}
      handleIndicatorStyle={{ backgroundColor: color.TEXT_SECONDARY }}
      enableDismissOnClose
      enablePanDownToClose
      onDismiss={() => {
        if (options?.onCancel) {
          options.onCancel();
        }
      }}
    >
      <BottomSheetScrollView
        style={[styles.scrollContainer, { backgroundColor: color.BACKGROUND }]}
        contentContainerStyle={[styles.container]}
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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ConfirmBottomSheet.displayName = "ConfirmBottomSheet";

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@vs",
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
