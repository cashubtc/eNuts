import React, { forwardRef, useCallback } from "react";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { TouchableOpacity, View, Text } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useTranslation } from "react-i18next";

import { TxtButton } from "@comps/Button";
import { CopyIcon, SendMsgIcon, ZapIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";

interface IBottomSheetOptionsModal {
  button1Txt: string;
  onPressFirstBtn: () => void;
  button2Txt: string;
  onPressSecondBtn: () => void;
  onPressCancel: () => void;
  loading?: boolean;
  isSend?: boolean;
  // Optional third button
  button3Txt?: string;
  button3Description?: string;
  button3Icon?: React.ReactNode;
  onPressThirdBtn?: () => void;
  onLongPressThirdBtn?: () => void;
  button3Disabled?: boolean;
  button3Loading?: boolean;
}

const BottomSheetOptionsModal = forwardRef<BottomSheet, IBottomSheetOptionsModal>(
  (
    {
      button1Txt,
      onPressFirstBtn,
      button2Txt,
      onPressSecondBtn,
      onPressCancel,
      loading,
      isSend,
      button3Txt,
      button3Description,
      button3Icon,
      onPressThirdBtn,
      onLongPressThirdBtn,
      button3Disabled,
      button3Loading,
    },
    ref,
  ) => {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();

    const handleFirstBtnPress = useCallback(() => {
      onPressFirstBtn();
      (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [onPressFirstBtn, ref]);

    const handleSecondBtnPress = useCallback(() => {
      onPressSecondBtn();
      (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [onPressSecondBtn, ref]);

    const handleThirdBtnPress = useCallback(() => {
      if (button3Disabled || button3Loading) return;
      onPressThirdBtn?.();
      // Don't close for NFC - let the payment flow handle it
    }, [onPressThirdBtn, button3Disabled, button3Loading]);

    const handleThirdBtnLongPress = useCallback(() => {
      if (button3Disabled || button3Loading) return;
      onLongPressThirdBtn?.();
    }, [onLongPressThirdBtn, button3Disabled, button3Loading]);

    const handleCancel = useCallback(() => {
      onPressCancel();
      (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [onPressCancel, ref]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose={true}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: color.BACKGROUND,
        }}
        handleIndicatorStyle={{
          backgroundColor: color.TEXT_SECONDARY,
        }}
        animateOnMount={true}
      >
        <BottomSheetScrollView
          style={[styles.scrollContainer, { backgroundColor: color.BACKGROUND }]}
          contentContainerStyle={[styles.container]}
          showsVerticalScrollIndicator={false}
        >
          <Txt
            txt={isSend ? t("send", { ns: NS.wallet }) : t("receive", { ns: NS.wallet })}
            bold
            center
            styles={[styles.hint]}
          />

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleFirstBtnPress}
            testID="send-ecash-option"
          >
            <View style={styles.iconContainer}>
              {isSend ? (
                <SendMsgIcon width={s(16)} height={s(16)} color={mainColors.VALID} />
              ) : loading ? (
                <View>
                  <Loading size="small" color={mainColors.VALID} />
                </View>
              ) : (
                <CopyIcon color={mainColors.VALID} />
              )}
            </View>
            <View style={styles.txtWrap}>
              <Text style={[styles.actionText, { color: color.TEXT }]}>{button1Txt}</Text>
              <Text style={[styles.descriptionText, { color: color.TEXT_SECONDARY }]}>
                {isSend ? t("sendEcashDashboard") : t("receiveEcashDashboard")}
              </Text>
            </View>
          </TouchableOpacity>

          <Separator style={[styles.separator]} />

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleSecondBtnPress}
            testID="pay-invoice-option"
          >
            <View style={styles.iconContainer}>
              <ZapIcon width={s(26)} height={s(26)} color={mainColors.ZAP} />
            </View>
            <View style={styles.txtWrap}>
              <Text style={[styles.actionText, { color: color.TEXT }]}>{button2Txt}</Text>
              <Text style={[styles.descriptionText, { color: color.TEXT_SECONDARY }]}>
                {isSend ? t("payInvoiceDashboard") : t("createInvoiceDashboard")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Optional third button (e.g., NFC payment) */}
          {button3Txt && onPressThirdBtn && (
            <>
              <Separator style={[styles.separator]} />

              <TouchableOpacity
                style={[styles.optionContainer, button3Disabled && styles.optionDisabled]}
                onPress={handleThirdBtnPress}
                onLongPress={handleThirdBtnLongPress}
                delayLongPress={400}
                disabled={button3Disabled}
                testID="third-option"
              >
                <View style={styles.iconContainer}>
                  {button3Loading ? <Loading size="small" color={mainColors.VALID} /> : button3Icon}
                </View>
                <View style={styles.txtWrap}>
                  <Text
                    style={[
                      styles.actionText,
                      { color: color.TEXT },
                      button3Disabled && { opacity: 0.5 },
                    ]}
                  >
                    {button3Txt}
                  </Text>
                  {button3Description && (
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: color.TEXT_SECONDARY },
                        button3Disabled && { opacity: 0.5 },
                      ]}
                    >
                      {button3Description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}

          <TxtButton
            txt={t("cancel")}
            onPress={handleCancel}
            style={[{ paddingBottom: vs(15), paddingTop: vs(25) }]}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

BottomSheetOptionsModal.displayName = "BottomSheetOptionsModal";

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@vs",
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    minWidth: "11%",
  },
  txtWrap: {
    width: "90%",
  },
  actionText: {
    fontSize: "14@vs",
    fontWeight: "500",
    marginBottom: "4@vs",
  },
  descriptionText: {
    fontSize: "12@vs",
  },
  hint: {
    fontSize: "18@vs",
    marginTop: "5@vs",
    marginBottom: "30@vs",
  },
  separator: {
    width: "100%",
    marginTop: "10@vs",
    marginBottom: "10@vs",
  },
});

export default BottomSheetOptionsModal;
