import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Button from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import MintHeaderSelector from "@comps/MintHeaderSelector";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import { useKnownMints } from "@src/context/KnownMints";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { vib } from "@util";
import { useCurrencyContext } from "@src/context/Currency";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, TextInput, View, StyleSheet } from "react-native";
import { useManager } from "@src/context/Manager";
import type { MintSelectAmountProps } from "@src/nav/navTypes";
import { useThemeContext } from "@src/context/Theme";
import useLoading from "@comps/hooks/Loading";

export default function MintSelectAmountScreen({ navigation }: MintSelectAmountProps) {
  const { t } = useTranslation([NS.wallet, NS.common]);
  const { shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const { loading, startLoading, stopLoading } = useLoading();
  const manager = useManager();
  const amountInputRef = useRef<TextInput>(null);

  const [amountInput, setAmountInput] = useState("");

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    knownMints[0] ?? null,
  );

  useEffect(() => {
    setSelectedMint((currentMint) => {
      const updatedMint = currentMint
        ? knownMints.find((mint) => mint.mintUrl === currentMint.mintUrl)
        : null;

      return updatedMint ?? knownMints[0] ?? null;
    });
  }, [knownMints]);

  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  const [err, setErr] = useState(false);

  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);

  const screenName = "createInvoice";

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleMintSelect = useCallback(
    (mint: KnownMintWithBalance) => {
      setSelectedMint(mint);
    },
    [setSelectedMint],
  );

  const handleMintSelectorOpen = useCallback(() => {
    amountInputRef.current?.blur();
  }, []);

  const triggerAmountError = useCallback(() => {
    vib(400);
    setErr(true);
    shake();
    const timeout = setTimeout(() => {
      setErr(false);
      clearTimeout(timeout);
    }, 500);
  }, [shake]);

  const handleSubmit = useCallback(async () => {
    if (loading || !selectedMint) {
      return;
    }

    if (!amountValue || amountValue < 1) {
      triggerAmountError();
      return;
    }

    startLoading();
    try {
      const operation = await manager.ops.mint.prepare({
        mintUrl: selectedMint.mintUrl,
        amount: amountValue,
        method: "bolt11",
      });
      amountInputRef.current?.blur();
      Keyboard.dismiss();
      return navigation.navigate("mintInvoice", {
        mintUrl: selectedMint.mintUrl,
        operation,
      });
    } catch (error) {
      console.error(error);
    } finally {
      stopLoading();
    }
  }, [
    amountValue,
    loading,
    manager,
    navigation,
    selectedMint,
    startLoading,
    stopLoading,
    triggerAmountError,
  ]);

  // Early return after all hooks
  if (noMintsAvailable) {
    return (
      <Screen
        screenName={t("selectAmount", { ns: NS.common })}
        withBackBtn
        handlePress={handleBack}
        withPadding={true}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Txt txt={t("noMintsWithBalance", { ns: NS.common })} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      screenName={t(screenName, { ns: NS.common })}
      withBackBtn
      handlePress={handleBack}
      withPadding={false}
      withBottomInset={false}
      withKeyboard={true}
      rightAction={
        <MintHeaderSelector
          selectedMint={selectedMint!}
          onMintSelect={handleMintSelect}
          onOpen={handleMintSelectorOpen}
          showZeroBalanceMints
        />
      }
    >
      <AmountInput
        ref={amountInputRef}
        value={amountInput}
        onChange={setAmountInput}
        onSubmit={handleSubmit}
        error={err}
        autoFocus
        testID="mint-amount-input"
      />

      <View style={styles.actionWrap}>
        <Button
          txt={t("continue", { ns: NS.common })}
          onPress={handleSubmit}
          icon={<ChevronRightIcon color={mainColors.WHITE} />}
          loading={loading}
        />
      </View>
    </Screen>
  );
}

interface IMeltOverviewProps {
  amount: number;
  shouldEstimate?: boolean;
  balTooLow?: boolean;
  isInvoice?: boolean;
  fee: number;
}

export function MeltOverview({
  amount,
  shouldEstimate,
  balTooLow,
  isInvoice,
  fee,
}: IMeltOverviewProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const { formatAmount } = useCurrencyContext();
  const total = shouldEstimate ? 0 : amount + fee;
  const { formatted, symbol } = formatAmount(total);

  return (
    <View style={styles.overview}>
      <Txt
        txt={
          t(isInvoice ? "invoiceInclFee" : "totalInclFee", {
            ns: NS.common,
          }) + "*"
        }
        bold
      />
      <Txt
        txt={`${formatted} ${symbol}`}
        styles={[
          {
            color:
              !shouldEstimate && balTooLow
                ? mainColors.ERROR
                : shouldEstimate
                  ? color.TEXT
                  : mainColors.VALID,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
