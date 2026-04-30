import Button from "@comps/Button";
import Txt from "@comps/Txt";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import React, { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

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
    const { color, highlight } = useThemeContext();
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
        backgroundColor={color.BACKGROUND}
        cornerRadius={s(26)}
        grabberOptions={{ color: color.TEXT_SECONDARY }}
        scrollable
        onDidDismiss={handleDismiss}
      >
        <ScrollView
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
        </ScrollView>
      </TrueSheet>
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
    paddingTop: "30@vs",
  },
  headerWrap: {
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
