import { getDecodedToken } from "@cashu/cashu-ts";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TProcessingPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useInitialURL } from "@src/context/Linking";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { decodeLnInvoice, isErr } from "@util";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

interface IErrorProps {
  e?: unknown;
  customMsg?: "requestMintErr" | "generalMeltingErr" | "invoiceFromLnurlError";
}

export default function ProcessingScreen({
  navigation,
  route,
}: TProcessingPageProps) {
  const { t } = useTranslation([NS.mints]);
  const { color } = useThemeContext();
  const { clearUrl } = useInitialURL();
  const {
    mint,
    tokenInfo,
    amount,
    memo,
    estFee,
    isMelt,
    isSendEcash,
    isSwap,
    isAutoSwap,
    isZap,
    payZap,
    targetMint,
    proofs,
    recipient,
  } = route.params;

  const processingTxt = useMemo(() => {
    if (isMelt) {
      return payZap ? "payingInvoice" : "meltingToken";
    }
    if (isSwap || isAutoSwap) {
      return "swapping";
    }
    if (isSendEcash) {
      return "sendingEcash";
    }
    if (isZap) {
      return "payingInvoice";
    }
    return "claimingToken";
  }, [isMelt, isSwap, isZap, payZap, isSendEcash, isAutoSwap]);

  const handleError = ({ e, customMsg }: IErrorProps) => {
    clearUrl();
    navigation.navigate("processingError", {
      errorMsg: customMsg
        ? t(customMsg, { ns: NS.error })
        : isErr(e)
        ? e.message
        : t("generalMeltingErr", { ns: NS.error }),
    });
  };

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View style={[globals(color).container, styles.container]}>
      <Txt
        txt={t(processingTxt, { ns: NS.wallet })}
        styles={[{ color: color.TEXT }]}
      />
      <Loading size={s(35)} />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
  },
  descText: {
    marginTop: "20@vs",
    textAlign: "center",
  },
  hint: {
    fontSize: "12@vs",
    marginTop: "10@vs",
  },
});
