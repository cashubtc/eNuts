import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Button from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { isErr, vib } from "@util";
import { useCallback, useRef, useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useManager } from "@src/context/Manager";
import { SendSelectAmountProps } from "@src/nav/navTypes";
import { useSend } from "coco-cashu-react";
import { usePromptContext } from "@src/context/Prompt";
import MintSelector from "@comps/MintSelector";

export default function SendSelectAmountScreen({ navigation }: SendSelectAmountProps) {
  const { t } = useTranslation([NS.wallet]);
  const { color } = useThemeContext();
  const { shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const manager = useManager();
  const amountInputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);
  const { isSending, prepareSend, executePreparedSend } = useSend();
  const { openPromptAutoClose } = usePromptContext();

  const [amountInput, setAmountInput] = useState("");

  const defaultMint = useMemo(() => {
    return knownMints.length > 0 ? knownMints[0] : null;
  }, [knownMints]);

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    defaultMint ?? null,
  );

  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  // Defer non-critical state initialization
  const [err, setErr] = useState(false);

  // Derived numeric amount and selected mint balance
  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);
  const selectedMintBalance = selectedMint?.balance || 0;

  // Memoize screen name computation
  const screenName = "sendEcash";

  // Back navigation handler
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleMintSelect = useCallback(
    (mint: KnownMintWithBalance) => {
      setSelectedMint(mint);
    },
    [setSelectedMint],
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

  const handleAmountSubmit = useCallback(async () => {
    if (!selectedMint) return;
    if (!amountValue || amountValue < 1 || amountValue > selectedMintBalance) {
      vib(400);
      setErr(true);
      shake();
      const t = setTimeout(() => {
        setErr(false);
        clearTimeout(t);
      }, 500);
      return;
    }
    const preparedSend = await prepareSend(selectedMint.mintUrl, amountValue);
    const { token } = await executePreparedSend(preparedSend.id, {
      onError: (e) => {
        console.error(e);
        openPromptAutoClose({
          msg: isErr(e) ? e.message : t("sendTokenErr", { ns: NS.error }),
        });
        shake();
      },
    });
    return navigation.navigate("encodedToken", {
      token,
    });
  }, [
    amountValue,
    selectedMint,
    manager,
    navigation,
    selectedMintBalance,
    shake,
    prepareSend,
    executePreparedSend,
    openPromptAutoClose,
    t,
  ]);

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
      withPadding={false}
      withBottomInset={false}
      withKeyboard={true}
    >
      <AmountInput
        ref={amountInputRef}
        value={amountInput}
        onChange={setAmountInput}
        onSubmit={handleAmountSubmit}
        error={err}
        autoFocus
        testID="send-amount-input"
      />

      {/* Mint Selection */}
      <View style={styles.actionWrap}>
        <View style={{ width: "100%", gap: vs(10), paddingBottom: vs(10) }}>
          <MintSelector mint={selectedMint!} onPress={handleMintSelectionOpen} />
          <Button
            txt={t("continue", { ns: NS.common })}
            onPress={handleAmountSubmit}
            icon={<ChevronRightIcon color={mainColors.WHITE} />}
            disabled={isSending}
          />
        </View>
      </View>

      <Suspense fallback={<View />}>
        <MintSelectionSheet
          ref={mintSelectionSheetRef}
          selectedMint={selectedMint!}
          onMintSelect={handleMintSelect}
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
    paddingHorizontal: "20@s",
  },
});
