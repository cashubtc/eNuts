import Button from "@comps/Button";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { AppText, verticalScale, fontScale, globals, useAppThemeTokens, Stack } from "@styles";
import React, { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from "react";
import { ScrollView, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      onConfirm,
      onCancel,
      children,
    },
    ref,
  ) => {
    const theme = useAppThemeTokens();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const sheetRef = useRef<TrueSheet>(null);
    const notifyCancelOnDismissRef = useRef(true);
    const maxDynamicContentSize = Math.floor(height * 0.9);
    const present = useCallback(() => {
      notifyCancelOnDismissRef.current = true;
      void sheetRef.current?.present();
    }, []);
    const close = useCallback((options?: { notifyCancel?: boolean }) => {
      notifyCancelOnDismissRef.current = options?.notifyCancel ?? false;
      void sheetRef.current?.dismiss();
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
    return (
      <TrueSheet
        ref={sheetRef}
        detents={["auto"]}
        maxContentHeight={maxDynamicContentSize}
        dismissible={false}
        draggable={false}
        backgroundColor={theme.background}
        cornerRadius={26}
        grabberOptions={{ color: theme.textSecondary }}
        scrollable
        onDidDismiss={handleDismiss}
      >
        <ScrollView
          style={[styles.scrollContainer, { backgroundColor: theme.background }]}
          contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}
          showsVerticalScrollIndicator={false}
        >
          <Stack style={styles.headerWrap}>
            <AppText style={[globals().modalHeader, { color: theme.text }, styles.headerTitle]}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                style={[styles.subtitle, { color: theme.textSecondary }]}
                align="center"
                testID={`${subtitle}-txt`}
              >
                {subtitle}
              </AppText>
            ) : null}
          </Stack>

          {children}

          <Stack style={styles.buttonContainer}>
            <Button
              txt={confirmText}
              onPress={onConfirm}
              loading={loading}
              disabled={confirmDisabled}
            />
            <Button txt={cancelText} onPress={handleCancel} outlined disabled={loading} />
          </Stack>
        </ScrollView>
      </TrueSheet>
    );
  },
);
ConfirmationModal.displayName = "ConfirmationModal";
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerWrap: {
    marginBottom: 18,
  },
  headerTitle: {
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontScale(14),
    lineHeight: verticalScale(20),
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
    marginBottom: 4,
  },
});
export default ConfirmationModal;
