import { isIOS } from "@consts";
import { PressableSurface, Stack, useAppThemeTokens } from "@styles";
import { KeyboardAvoidingView, Modal, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IMyModalProps {
  type: "bottom" | "question" | "success" | "error" | "invoiceAmount";
  animation?: "slide" | "fade" | "none";
  visible?: boolean;
  success?: boolean;
  hasNoPadding?: boolean;
  close?: () => void;
  // onBackdropPress?: () => void
  children: React.ReactNode;
}

export default function MyModal({
  type,
  animation,
  visible,
  success,
  hasNoPadding,
  close,
  // onBackdropPress,
  children,
}: IMyModalProps) {
  const theme = useAppThemeTokens();
  const insets = useSafeAreaInsets();

  const getCorrectStyle = () => {
    if (type === "bottom") {
      return styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).bottomView;
    }
    if (type === "question" || type === "success" || type === "error" || type === "invoiceAmount") {
      return styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).centeredView;
    }
  };

  const getViewStyle = () => {
    if (type === "bottom") {
      return {
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).common,
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).modalView,
        paddingBottom: 20 + insets.bottom,
      };
    }
    if (type === "question") {
      return {
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).common,
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop)
          .centeredModalView,
      };
    }
    if (type === "success") {
      return {
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).common,
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop)
          .successModalView,
      };
    }
    if (type === "error") {
      return {
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).common,
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).promptModalView,
      };
    }
    if (type === "invoiceAmount") {
      let styling = {
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).common,
        ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop)
          .invoiceAmountModalView,
      };
      if (hasNoPadding) {
        styling = {
          ...styling,
          ...styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).contactList,
        };
      }
      return styling;
    }
  };

  return visible ? (
    <Stack
      style={styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).modalParent}
    >
      <Modal
        visible
        transparent
        animationType={animation}
        onRequestClose={close}
        testID="testCoinSelectionModal"
      >
        <PressableSurface
          style={
            styles(theme.background, theme.accent, theme.black, theme.modalBackdrop).modalContainer
          }
          activeOpacity={1}
          onPressOut={close}
        >
          <KeyboardAvoidingView style={getCorrectStyle()} behavior={isIOS ? "height" : undefined}>
            <TouchableWithoutFeedback>
              <Stack style={[getViewStyle(), success ? { backgroundColor: theme.accent } : {}]}>
                {children}
              </Stack>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </PressableSurface>
      </Modal>
    </Stack>
  ) : null;
}

const styles = (background: string, accent: string, shadowColor: string, modalBackdrop: string) =>
  StyleSheet.create({
    modalParent: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: modalBackdrop,
    },
    modalContainer: {
      flex: 1,
    },
    common: {
      backgroundColor: background,
      alignItems: "center",
      shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    // Bottom Modal
    bottomView: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    modalView: {
      width: "100%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    // Centered Modal
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    centeredModalView: {
      width: "90%",
      borderRadius: 20,
      borderWidth: 3,
      borderColor: accent,
      paddingTop: 50,
      paddingBottom: 50,
      paddingRight: 20,
      paddingLeft: 20,
    },
    // Success Modal
    successModalView: {
      width: "90%",
      borderRadius: 20,
    },
    promptModalView: {
      width: "90%",
      borderRadius: 20,
      borderWidth: 3,
      borderColor: accent,
      padding: 20,
    },
    invoiceAmountModalView: {
      width: "100%",
      height: "100%",
      padding: 20,
      justifyContent: "space-between",
    },
    contactList: {
      paddingHorizontal: 0,
    },
  });
