import type { TextStyle, ViewStyle } from "react-native";

import { highlight, type HighlightKey, mainColors, type Theme } from "./colors";

type TGlobalStyle = TextStyle & ViewStyle;
type TGlobalStyles = Record<string, TGlobalStyle>;

export const globalStyles = (color?: Theme, h?: HighlightKey) =>
  ({
    container: {
      flex: 1,
      backgroundColor: color?.BACKGROUND,
    },
    fullWidth: {
      width: "100%",
    },
    txt: {
      fontSize: 14,
      color: color?.TEXT,
    },
    txtBold: {
      fontSize: 14,
      fontWeight: "500",
      color: color?.TEXT,
    },
    pressTxt: {
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
      color: h ? highlight[h] : mainColors.BLACK,
    },
    navTxt: {
      fontSize: 18,
      fontWeight: "500",
      color: color?.TEXT,
    },
    input: {
      color: color?.TEXT,
      backgroundColor: color?.INPUT_BG,
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: 50,
      fontSize: 14,
      width: "100%",
    },
    modalHeader: {
      fontSize: 22,
      fontWeight: "500",
      marginBottom: 30,
      marginTop: 10,
      textAlign: "center",
      color: color?.TEXT,
    },
    modalTxt: {
      fontSize: 14,
      textAlign: "center",
      color: color?.TEXT,
      marginHorizontal: 20,
      marginTop: -15,
      marginBottom: 30,
    },
    scrollContainer: {
      flex: 1,
      borderRadius: 20,
      backgroundColor: color?.DRAWER,
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
      backgroundColor: color?.DRAWER,
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
      // backgroundColor: '#fff'
    },
    radioBtn: {
      borderWidth: 1,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderColor: color?.BORDER,
    },
    bold: {
      fontWeight: "500",
    },
    selectAmount: {
      width: "100%",
      fontSize: 48,
      marginBottom: 5,
      fontWeight: "600",
      padding: 0,
      textAlign: "center",
    },
  }) satisfies TGlobalStyles;
