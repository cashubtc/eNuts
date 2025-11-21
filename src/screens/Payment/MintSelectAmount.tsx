import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Button from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatSatStr, vib } from "@util";
import { useCallback, useRef, useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useManager } from "@src/context/Manager";
import { MintSelectAmountProps } from "@src/nav/navTypes";
import MintSelector from "@comps/MintSelector";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useThemeContext } from "@src/context/Theme";

export default function MintSelectAmountScreen({
  navigation,
}: MintSelectAmountProps) {
  const { t } = useTranslation([NS.wallet]);
  const { shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const manager = useManager();
  const amountInputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);

  const [amountInput, setAmountInput] = useState("");

  const defaultMint = useMemo(() => {
    return knownMints.length > 0 ? knownMints[0] : null;
  }, [knownMints]);

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    defaultMint ?? null
  );

  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  // Defer non-critical state initialization
  const [err, setErr] = useState(false);

  // Derived numeric amount
  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);

  // Memoize screen name computation
  const screenName = "createInvoice";

  // Back navigation handler
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleMintSelect = useCallback(
    (mint: KnownMintWithBalance) => {
      setSelectedMint(mint);
    },
    [setSelectedMint]
  );

  const handleMintSelectionOpen = useCallback(() => {
    // Blur the input when opening the sheet
    amountInputRef.current?.blur();

    // Try expand method first, fallback to snapToIndex
    if (mintSelectionSheetRef.current) {
      try {
        mintSelectionSheetRef.current.present();
      } catch (error) {
        /* ignore */
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMint) return;
    if (!amountValue || amountValue < 1) {
      vib(400);
      setErr(true);
      shake();
      const t = setTimeout(() => {
        setErr(false);
        clearTimeout(t);
      }, 500);
      return;
    }
    const quote = await manager.quotes.createMintQuote(
      selectedMint.mintUrl,
      amountValue
    );
    return navigation.navigate("mintInvoice", {
      mintUrl: selectedMint.mintUrl,
      quote,
    });
  }, [amountValue, selectedMint, manager, navigation, shake]);

  // Early return after all hooks
  if (noMintsAvailable) {
    return (
      <Screen
        screenName={t("selectAmount", { ns: NS.common })}
        withBackBtn
        handlePress={handleBack}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
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

      {/* Mint Selection Button - More seamless design */}

      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : undefined}
        style={styles.actionWrap}
      >
        <View style={{ width: "100%", gap: vs(10), paddingBottom: vs(10) }}>
          <MintSelector
            mint={selectedMint!}
            onPress={handleMintSelectionOpen}
          />
          <Button
            txt={t("continue", { ns: NS.common })}
            onPress={handleSubmit}
            icon={<ChevronRightIcon color={mainColors.WHITE} />}
          />
        </View>
      </KeyboardAvoidingView>

      <Suspense fallback={<View />}>
        <MintSelectionSheet
          ref={mintSelectionSheetRef}
          selectedMint={selectedMint!}
          onMintSelect={handleMintSelect}
          showZeroBalanceMints={true}
        />
      </Suspense>
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
        txt={formatSatStr(shouldEstimate ? 0 : amount + fee)}
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

const styles = ScaledSheet.create({
  overview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
});
