import { getDecodedToken } from "@cashu/cashu-ts";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import { getMintBalance } from "@db";
import type { IMintUrl } from "@model";
import type { TBeforeRemoveEvent, TProcessingPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useHistoryContext } from "@src/context/History";
import { useInitialURL } from "@src/context/Linking";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { isLnurlOrAddress } from "@src/util/lnurl";
import { getDefaultMint } from "@store/mintStore";
import { globals } from "@styles";
import { decodeLnInvoice, getInvoiceFromLnurl, isErr, isNum } from "@util";
import {
  autoMintSwap,
  checkFees,
  fullAutoMintSwap,
  getHighestBalMint,
  payLnInvoice,
  requestMint,
  sendToken,
} from "@wallet";
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
  const { addHistoryEntry } = useHistoryContext();
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

  const handleMintRequest = async () => {
    try {
      const { pr, hash } = await requestMint(mint.mintUrl, amount);
      clearUrl();
      navigation.navigate("mintInvoice", {
        mintUrl: mint.mintUrl,
        amount,
        hash,
        expiry: decodeLnInvoice(pr).expiry,
        paymentRequest: pr,
      });
    } catch (e) {
      handleError({ e, customMsg: "requestMintErr" });
    }
  };

  const handleTokenClaim = async () => {
    if (!tokenInfo) {
      return handleError({});
    }
    try {
      const success = await sendToken(tokenInfo.decoded, mint.mintUrl);
      if (!success) {
        return handleError({});
      }
      await addHistoryEntry({
        amount: tokenInfo.value,
        type: 1,
        value: tokenInfo.encoded,
        mints: [mint.mintUrl],
      });
      clearUrl();
      navigation.navigate("success", {
        amount: tokenInfo.value,
        memo: tokenInfo.decoded.memo,
        isClaim: true,
      });
    } catch (e) {
      handleError({ e });
    }
  };

  const handleSendEcash = async () => {
    console.log("sending ecash");
    if (!proofs?.length) {
      return handleError({});
    }
    try {
      const encodedToken = await sendToken(
        mint.mintUrl,
        amount,
        memo || "",
        proofs
      );
      if (!encodedToken) {
        return handleError({});
      }
      const entry = await addHistoryEntry({
        amount: amount,
        type: 1,
        value: encodedToken,
        mints: [mint.mintUrl],
        recipient,
      });
      clearUrl();
      navigation.navigate("encodedToken", {
        token: getDecodedToken(encodedToken),
      });
    } catch (e) {
      console.log("error sending ecash", e);
      handleError({ e });
    }
  };

  const handleMelt = async () => {
    if (!proofs?.length || !recipient) {
      return handleError({});
    }
    try {
      const success = await payLnInvoice(
        mint.mintUrl,
        recipient,
        proofs,
        estFee
      );
      if (!success) {
        return handleError({});
      }
      await addHistoryEntry({
        amount,
        type: 3,
        value: recipient,
        mints: [mint.mintUrl],
        fee: estFee || 0,
      });
      clearUrl();
      navigation.navigate("success", {
        amount,
        fee: estFee,
        isMelt: true,
      });
    } catch (e) {
      handleError({ e });
    }
  };

  const handleSwap = async () => {
    if (!proofs?.length || !targetMint) {
      return handleError({});
    }
    try {
      const success = await autoMintSwap(
        mint.mintUrl,
        targetMint.mintUrl,
        proofs,
        amount
      );
      if (!success) {
        return handleError({});
      }
      await addHistoryEntry({
        amount,
        type: 4,
        value: `${mint.mintUrl} -> ${targetMint.mintUrl}`,
        mints: [mint.mintUrl, targetMint.mintUrl],
      });
      clearUrl();
      navigation.navigate("success", {
        amount,
        isSwap: true,
      });
    } catch (e) {
      handleError({ e });
    }
  };

  const handleAutoSwap = async () => {
    if (!targetMint) {
      return handleError({});
    }
    try {
      const success = await fullAutoMintSwap(
        mint.mintUrl,
        targetMint.mintUrl,
        amount
      );
      if (!success) {
        return handleError({});
      }
      await addHistoryEntry({
        amount,
        type: 4,
        value: `${mint.mintUrl} -> ${targetMint.mintUrl}`,
        mints: [mint.mintUrl, targetMint.mintUrl],
      });
      clearUrl();
      navigation.navigate("success", {
        amount,
        isAutoSwap: true,
      });
    } catch (e) {
      handleError({ e });
    }
  };

  const handleZap = async () => {
    if (!recipient) {
      return handleError({});
    }
    try {
      let invoice = recipient;
      if (isLnurlOrAddress(recipient)) {
        const lnurlInvoice = await getInvoiceFromLnurl(recipient, amount);
        if (!lnurlInvoice) {
          return handleError({ customMsg: "invoiceFromLnurlError" });
        }
        invoice = lnurlInvoice;
      }
      const { amount: invoiceAmount, expiry } = decodeLnInvoice(invoice);
      if (Date.now() / 1000 > expiry) {
        return handleError({});
      }
      const fee = await checkFees(mint.mintUrl, invoice);
      if (!isNum(fee)) {
        return handleError({});
      }
      const mintBalance = await getMintBalance(mint.mintUrl);
      if (mintBalance < invoiceAmount + fee) {
        const defaultMint = await getDefaultMint();
        if (defaultMint && defaultMint !== mint.mintUrl) {
          const defaultMintBalance = await getMintBalance(defaultMint);
          if (defaultMintBalance >= invoiceAmount + fee) {
            return navigation.navigate("processing", {
              mint: { mintUrl: defaultMint, customName: "" },
              amount: invoiceAmount,
              estFee: fee,
              isMelt: true,
              recipient: invoice,
              isZap: true,
            });
          }
        }
        const highestBalMint = await getHighestBalMint();
        if (highestBalMint && highestBalMint.balance >= invoiceAmount + fee) {
          return navigation.navigate("processing", {
            mint: {
              mintUrl: highestBalMint.mintUrl,
              customName: "",
            },
            amount: invoiceAmount,
            estFee: fee,
            isMelt: true,
            recipient: invoice,
            isZap: true,
          });
        }
        return handleError({});
      }
      return navigation.navigate("coinSelection", {
        mint,
        balance: mintBalance,
        amount: invoiceAmount,
        estFee: fee,
        isMelt: true,
        recipient: invoice,
        isZap: true,
      });
    } catch (e) {
      handleError({ e });
    }
  };

  useEffect(() => {
    if (tokenInfo) {
      return void handleTokenClaim();
    }
    if (isSendEcash) {
      return void handleSendEcash();
    }
    if (isMelt) {
      return void handleMelt();
    }
    if (isSwap) {
      return void handleSwap();
    }
    if (isAutoSwap) {
      return void handleAutoSwap();
    }
    if (isZap) {
      return void handleZap();
    }
    // mint new tokens
    void handleMintRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
