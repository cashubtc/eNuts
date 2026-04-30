import Button from "@comps/Button";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaledSheet, vs } from "react-native-size-matters";

export type ConfirmationModalRef = {
  present: () => void;
  close: (options?: { notifyCancel?: boolean }) => void;
};

interface IConfirmationModalProps {
  title: string;
  subtitle?: string;
  confirmText: string;
  cancelText: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  dismissible?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
}

const ConfirmationModal = forwardRef<ConfirmationModalRef, IConfirmationModalProps>(
  (
    {
      title,
      subtitle,
      confirmText,
      cancelText,
      loading = false,
      confirmDisabled = false,
      dismissible = true,
      onConfirm,
      onCancel,
      children,
    },
    ref,
  ) => {
    const { color, highlight } = useThemeContext();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const sheetRef = useRef<BottomSheetModal>(null);
    const notifyCancelOnDismissRef = useRef(true);
    const maxDynamicContentSize = Math.floor(height * 0.9);

    const present = useCallback(() => {
      notifyCancelOnDismissRef.current = true;
      sheetRef.current?.present();
    }, []);

    const close = useCallback((options?: { notifyCancel?: boolean }) => {
      notifyCancelOnDismissRef.current = options?.notifyCancel ?? false;
      sheetRef.current?.dismiss();
    }, []);

    useImperativeHandle(ref, () => ({ present, close }), [present, close]);

    const handleCancel = useCallback(() => {
      close({ notifyCancel: true });
    }, [close]);

    const handleDismiss = useCallback(() => {
      const shouldNotifyCancel = notifyCancelOnDismissRef.current;
      notifyCancelOnDismissRef.current = true;

      if (shouldNotifyCancel) {
        onCancel();
      }
    }, [onCancel]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior={loading || !dismissible ? "none" : "close"}
        />
      ),
      [dismissible, loading],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        maxDynamicContentSize={maxDynamicContentSize}
        enableDismissOnClose
        enablePanDownToClose={!loading && dismissible}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.BACKGROUND }}
        handleIndicatorStyle={{ backgroundColor: color.TEXT_SECONDARY }}
        onDismiss={handleDismiss}
      >
        <BottomSheetScrollView
          style={[styles.scrollContainer, { backgroundColor: color.BACKGROUND }]}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, vs(20)) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerWrap}>
            <Text style={[globals(color, highlight).modalHeader, styles.headerTitle]}>{title}</Text>
            {subtitle ? (
              <Txt
                txt={subtitle}
                center
                styles={[styles.subtitle, { color: color.TEXT_SECONDARY }]}
              />
            ) : null}
          </View>

          {children}

          <View style={styles.buttonContainer}>
            <Button
              txt={confirmText}
              onPress={onConfirm}
              loading={loading}
              disabled={confirmDisabled}
            />
            <Button txt={cancelText} onPress={handleCancel} outlined disabled={loading} />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

ConfirmationModal.displayName = "ConfirmationModal";

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: "20@s",
  },
  headerWrap: {
    marginTop: "6@vs",
    marginBottom: "18@vs",
  },
  headerTitle: {
    marginBottom: "6@vs",
  },
  subtitle: {
    fontSize: "14@vs",
    lineHeight: "20@vs",
  },
  buttonContainer: {
    width: "100%",
    gap: "10@vs",
    marginBottom: "4@vs",
  },
});

export default ConfirmationModal;
