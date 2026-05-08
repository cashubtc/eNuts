import type { TextStyle, ViewStyle } from "react-native";

import { appFontSize } from "./fonts";

type TGlobalStyle = TextStyle & ViewStyle;
type TGlobalStyles = Record<string, TGlobalStyle>;

export const globalStyles = () =>
  ({
    container: {
      flex: 1,
    },
    fullWidth: {
      width: "100%",
    },
    txt: {
      fontSize: appFontSize.body,
    },
    txtBold: {
      fontSize: appFontSize.body,
      fontWeight: "500",
    },
    pressTxt: {
      fontSize: appFontSize.body,
      fontWeight: "500",
      textAlign: "center",
    },
    navTxt: {
      fontSize: appFontSize.label,
      fontWeight: "500",
    },
    input: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: 50,
      fontSize: appFontSize.body,
      width: "100%",
    },
    modalHeader: {
      fontSize: appFontSize.modalTitle,
      fontWeight: "500",
      marginBottom: 30,
      marginTop: 10,
      textAlign: "center",
    },
    modalTxt: {
      fontSize: appFontSize.body,
      textAlign: "center",
      marginHorizontal: 20,
      marginTop: -15,
      marginBottom: 30,
    },
    scrollContainer: {
      flex: 1,
      borderRadius: 20,
      padding: 0,
    },
    scrollRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    wrapContainer: {
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 5,
      marginBottom: 20,
    },
    wrapRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 20,
    },
    radioBtn: {
      borderWidth: 1,
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    bold: {
      fontWeight: "500",
    },
    selectAmount: {
      width: "100%",
      fontSize: appFontSize.amountInput,
      marginBottom: 5,
      fontWeight: "600",
      padding: 0,
      textAlign: "center",
    },
  }) satisfies TGlobalStyles;
