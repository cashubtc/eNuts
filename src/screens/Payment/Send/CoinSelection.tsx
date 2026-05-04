import Separator from "@comps/Separator";
import SwipeButton from "@comps/SwipeButton";
import { _testmintUrl } from "@consts";
import type { IProofSelection } from "@model";
import type { TCoinSelectionPageProps } from "@model/nav";
import Screen from "@comps/Screen";
// Helper functions to replace nostr utilities
function truncateStr(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}
import { useInitialURL } from "@src/context/Linking";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import TrustMintBottomSheet, { type TrustMintBottomSheetRef } from "@modal/TrustMintBottomSheet";
import { AppText, fontScale, globals, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl, getSelectedAmount, isNum } from "@util";
import { isLightningAddress } from "@util/lnurl";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OverviewRow } from "@comps/OverviewRow";
export default function CoinSelectionScreen({ navigation, route }: TCoinSelectionPageProps) {
  const {
    mint,
    balance,
    amount,
    memo,
    estFee,
    recipient,
    isMelt,
    isZap,
    isSendEcash,
    isSwap,
    targetMint,
    scanned,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const { url, clearUrl } = useInitialURL();
  const trustMintRef = useRef<TrustMintBottomSheetRef>(null);
  const getPaymentType = () => {
    if (isZap) {
      return "zap";
    }
    if (isMelt) {
      return "cashOutFromMint";
    }
    if (isSwap) {
      return "multimintSwap";
    }
    return "sendEcash";
  };
  const getBtnTxt = () => {
    if (isZap) {
      return "zapNow";
    }
    if (isMelt) {
      return "submitPaymentReq";
    }
    if (isSwap) {
      return "swapNow";
    }
    return "createToken";
  };
  const getRecipient = () => {
    if (recipient) {
      return !isLightningAddress(recipient) ? truncateStr(recipient, 16) : recipient;
    }
    return t("n/a");
  };
  const submitPaymentReq = async () => {
    //TODO: Add proofs
    const proofs: IProofSelection[] = [];
    navigation.navigate("processing", {
      mint,
      amount,
      memo,
      estFee,
      isMelt,
      isSendEcash,
      isSwap,
      isZap,
      payZap: true,
      targetMint,
      proofs: proofs.map((p) => ({ ...p, selected: true })),
      recipient,
    });
  };
  return (
    <Screen
      screenName={t("paymentOverview", { ns: NS.mints })}
      withCancelBtn
      handlePress={() => {
        const routes = navigation.getState()?.routes;
        const prevRoute = routes[routes.length - 2];
        // if user comes from processing screen, navigate back to dashboard
        // @ts-expect-error navigation type is not complete
        if (prevRoute?.name === "processing" && prevRoute.params?.isZap) {
          // clear the deep link url if user cancels
          clearUrl();
          return navigation.navigate("dashboard");
        }
        navigation.goBack();
      }}
      withBackBtn
    >
      <ScrollView alwaysBounceVertical={false} style={{ marginBottom: 90 }}>
        <Stack style={(globals().wrapContainer, { backgroundColor: theme.drawer })}>
          <OverviewRow txt1={t("paymentType")} txt2={t(getPaymentType())} />
          <OverviewRow txt1={t("mint")} txt2={mint.customName || formatMintUrl(mint.mintUrl)} />
          {recipient && <OverviewRow txt1={t("recipient")} txt2={getRecipient()} />}
          {isSwap && targetMint && (
            <OverviewRow
              txt1={t("recipient")}
              txt2={targetMint.customName || formatMintUrl(targetMint.mintUrl)}
            />
          )}
          <OverviewRow
            txt1={t("amount")}
            txt2={`${formatAmount(amount).formatted} ${formatAmount(amount).symbol}`}
          />
          {isNum(estFee) && !isSendEcash && (
            <OverviewRow
              txt1={t("estimatedFees")}
              txt2={`${formatAmount(estFee).formatted} ${formatAmount(estFee).symbol}`}
            />
          )}
          <Stack>
            <AppText
              style={[{ fontWeight: "500", marginBottom: 5 }]}
              testID={`${t("balanceAfterTX")}-txt`}
            >
              {t("balanceAfterTX")}
            </AppText>
            <AppText
              style={[{ color: theme.textSecondary }]}
              testID={`${
                estFee > 0
                  ? `${formatAmount(balance - amount - estFee).formatted} ${t("to")} ${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`
                  : `${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`
              }-txt`}
            >
              {estFee > 0
                ? `${formatAmount(balance - amount - estFee).formatted} ${t("to")} ${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`
                : `${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`}
            </AppText>
          </Stack>
          <Separator style={[{ marginTop: 20 }]} />
          {memo && memo.length > 0 && (
            <OverviewRow txt1={t("memo", { ns: NS.history })} txt2={memo} />
          )}
        </Stack>
      </ScrollView>
      <Stack
        style={[
          styles.swipeContainer,
          {
            backgroundColor: theme.background,
            bottom: insets.bottom,
          },
        ]}
      >
        <SwipeButton txt={t(getBtnTxt())} onToggle={submitPaymentReq} />
      </Stack>
      <TrustMintBottomSheet ref={trustMintRef} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coinSelectionHint: {
    fontSize: fontScale(10),
    maxWidth: "88%",
  },
  swipeContainer: {
    position: "absolute",
    width: "100%",
  },
});
