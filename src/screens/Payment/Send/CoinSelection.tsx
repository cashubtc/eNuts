import Separator from "@comps/Separator";
import SwipeButton from "@comps/SwipeButton";
import Txt from "@comps/Txt";
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
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import TrustMintBottomSheet, {
  type TrustMintBottomSheetRef,
} from "@modal/TrustMintBottomSheet";
import { globals } from "@styles";
import {
  formatMintUrl,
  getSelectedAmount,
  isNum,
} from "@util";
import { isLightningAddress } from "@util/lnurl";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet } from "react-native-size-matters";
import { OverviewRow } from "@comps/OverviewRow";

export default function CoinSelectionScreen({
  navigation,
  route,
}: TCoinSelectionPageProps) {
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
  const { color } = useThemeContext();
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
      return !isLightningAddress(recipient)
        ? truncateStr(recipient, 16)
        : recipient;
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
      <ScrollView alwaysBounceVertical={false} style={{ marginBottom: s(90) }}>
        <View style={globals(color).wrapContainer}>
          <OverviewRow txt1={t("paymentType")} txt2={t(getPaymentType())} />
          <OverviewRow
            txt1={t("mint")}
            txt2={mint.customName || formatMintUrl(mint.mintUrl)}
          />
          {recipient && (
            <OverviewRow txt1={t("recipient")} txt2={getRecipient()} />
          )}
          {isSwap && targetMint && (
            <OverviewRow
              txt1={t("recipient")}
              txt2={targetMint.customName || formatMintUrl(targetMint.mintUrl)}
            />
          )}
          <OverviewRow txt1={t("amount")} txt2={`${formatAmount(amount).formatted} ${formatAmount(amount).symbol}`} />
          {isNum(estFee) && !isSendEcash && (
            <OverviewRow
              txt1={t("estimatedFees")}
              txt2={`${formatAmount(estFee).formatted} ${formatAmount(estFee).symbol}`}
            />
          )}
          <View>
            <Txt
              txt={t("balanceAfterTX")}
              styles={[{ fontWeight: "500", marginBottom: s(5) }]}
            />
            <Txt
              txt={
                estFee > 0
                  ? `${formatAmount(balance - amount - estFee).formatted} ${t(
                      "to"
                    )} ${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`
                  : `${formatAmount(balance - amount).formatted} ${formatAmount(balance - amount).symbol}`
              }
              styles={[{ color: color.TEXT_SECONDARY }]}
            />
          </View>
          <Separator style={[{ marginTop: s(20) }]} />
          {memo && memo.length > 0 && (
            <OverviewRow txt1={t("memo", { ns: NS.history })} txt2={memo} />
          )}
        </View>
      </ScrollView>
      <View
        style={[
          styles.swipeContainer,
          {
            backgroundColor: color.BACKGROUND,
            bottom: insets.bottom,
          },
        ]}
      >
        <SwipeButton txt={t(getBtnTxt())} onToggle={submitPaymentReq} />
      </View>
      <TrustMintBottomSheet ref={trustMintRef} />
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coinSelectionHint: {
    fontSize: "10@vs",
    maxWidth: "88%",
  },
  swipeContainer: {
    position: "absolute",
    width: "100%",
  },
});
