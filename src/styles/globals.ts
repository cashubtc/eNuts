import type { TextStyle, ViewStyle } from "react-native";

import { fontScale } from "./scale";

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
      fontSize: fontScale(14),
    },
    txtBold: {
      fontSize: fontScale(14),
      fontWeight: "500",
    },
    pressTxt: {
      fontSize: fontScale(14),
      fontWeight: "500",
      textAlign: "center",
    },
    navTxt: {
      fontSize: fontScale(18),
      fontWeight: "500",
    },
    input: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: 50,
      fontSize: fontScale(14),
      width: "100%",
    },
    modalHeader: {
      fontSize: fontScale(22),
      fontWeight: "500",
      marginBottom: 30,
      marginTop: 10,
      textAlign: "center",
    },
    modalTxt: {
      fontSize: fontScale(14),
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
      fontSize: fontScale(48),
      marginBottom: 5,
      fontWeight: "600",
      padding: 0,
      textAlign: "center",
    },
  }) satisfies TGlobalStyles;
