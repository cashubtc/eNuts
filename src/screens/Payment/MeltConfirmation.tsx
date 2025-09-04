import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import TopNav from "@nav/TopNav";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { formatMintUrl, formatSatStr, isErr } from "@util";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { isIOS } from "@consts";
import { MeltConfirmationProps } from "@src/nav/navTypes";
import { OverviewRow } from "@screens/Payment/Send/ProofList";
import SwipeButton from "@comps/SwipeButton";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import { usePromptContext } from "@src/context/Prompt";
import { useManager } from "@src/context/Manager";

export default function MeltConfirmationScreen({
  navigation,
  route,
}: MeltConfirmationProps) {
  const { quote, mintUrl } = route.params;
  const { knownMints } = useKnownMints();
  const manager = useManager();
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const { loading, startLoading, stopLoading } = useLoading();
  const { openPromptAutoClose } = usePromptContext();

  const mint = knownMints.find((m) => m.mintUrl === mintUrl);
  const mintName = mint?.mintInfo.name || formatMintUrl(mintUrl);
  const totalWithFees = (quote?.amount || 0) + (quote?.fee_reserve || 0);

  async function handleConfirm() {
    try {
      startLoading();
      await manager.quotes.payMeltQuote(mintUrl, quote.quote);
      navigation.navigate("success", {
        amount: quote.amount,
        fee: quote.fee_reserve,
        isMelt: true,
      });
    } catch (e) {
      if (isErr(e)) {
        openPromptAutoClose({ msg: e.message || "Somethine went wront" });
      }
      console.error(e);
    } finally {
      stopLoading();
    }
  }

  return (
    <Screen>
      <TopNav
        screenName={t("lnPayment")}
        withBackBtn
        handlePress={() => navigation.goBack()}
        disableMintBalance
      />

      <ScrollView
        alwaysBounceVertical={false}
        style={{ marginBottom: 90 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <View style={globals(color).wrapContainer}>
          <OverviewRow txt1={t("mint")} txt2={mintName} />
          <OverviewRow txt1={t("amount")} txt2={formatSatStr(quote.amount)} />
          <OverviewRow
            txt1={t("estimatedFees")}
            txt2={formatSatStr(quote.fee_reserve)}
          />
          <OverviewRow
            txt1={t("totalInclFee")}
            txt2={formatSatStr(totalWithFees)}
          />
        </View>
      </ScrollView>
      <Button txt={t("confirm")} onPress={handleConfirm} disabled={loading} />
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingBottom: isIOS ? "50@vs" : "20@vs",
    paddingTop: "90@vs",
  },
  pasteInputTxtWrap: {
    position: "absolute",
    right: "10@s",
    top: "10@vs",
    padding: "10@s",
  },
  actionWrap: {
    paddingHorizontal: "20@s",
  },
  placeholder: {
    height: "20@vs",
  },
  // Mint selector styles - Same as SelectAmount.tsx
  seamlessMintSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "20@s",
    paddingVertical: "12@vs",
    marginHorizontal: "20@s",
    marginTop: "16@vs",
    borderBottomWidth: 1,
  },
  mintSelectorInfo: {
    flex: 1,
  },
  seamlessMintName: {
    fontSize: "12@s",
    marginBottom: "2@vs",
  },
  seamlessMintBalance: {
    fontSize: "14@s",
    fontWeight: "500",
  },
});
