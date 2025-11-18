import { isIOS } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi, HighlightKey, mainColors, Theme } from "@styles";
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
  const { color, highlight } = useThemeContext();
  const insets = useSafeAreaInsets();

  const getCorrectStyle = () => {
    if (type === "bottom") {
      return styles(color, highlight).bottomView;
    }
    if (
      type === "question" ||
      type === "success" ||
      type === "error" ||
      type === "invoiceAmount"
    ) {
      return styles(color, highlight).centeredView;
    }
  };

  const getViewStyle = () => {
    if (type === "bottom") {
      return {
        ...styles(color, highlight).common,
        ...styles(color, highlight).modalView,
        paddingBottom: 20 + insets.bottom,
      };
    }
    if (type === "question") {
      return {
        ...styles(color, highlight).common,
        ...styles(color, highlight).centeredModalView,
      };
    }
    if (type === "success") {
      return {
        ...styles(color, highlight).common,
        ...styles(color, highlight).successModalView,
      };
    }
    if (type === "error") {
      return {
        ...styles(color, highlight).common,
        ...styles(color, highlight).promptModalView,
      };
    }
    if (type === "invoiceAmount") {
      let styling = {
        ...styles(color, highlight).common,
        ...styles(color, highlight).invoiceAmountModalView,
      };
      if (hasNoPadding) {
        styling = { ...styling, ...styles(color, highlight).contactList };
      }
      return styling;
    }
  };

  return visible ? (
    <View style={styles(color, highlight).modalParent}>
      <Modal
        visible
        transparent
        animationType={animation}
        onRequestClose={close}
        testID="testCoinSelectionModal"
      >
        <TouchableOpacity
          style={styles(color, highlight).modalContainer}
          activeOpacity={1}
          onPressOut={close}
        >
          <KeyboardAvoidingView
            style={getCorrectStyle()}
            behavior={isIOS ? "height" : undefined}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  getViewStyle(),
                  success ? { backgroundColor: hi[highlight] } : {},
                ]}
              >
                {children}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  ) : null;
}

const styles = (pref: Theme, h: HighlightKey) =>
  StyleSheet.create({
    modalParent: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(0, 0, 0, .5)",
    },
    modalContainer: {
      flex: 1,
    },
    common: {
      backgroundColor: pref.BACKGROUND,
      alignItems: "center",
      shadowColor: mainColors.BLACK,
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
      borderColor: hi[h],
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
      borderColor: hi[h],
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
