import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Button from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import MintHeaderSelector from "@comps/MintHeaderSelector";
import Screen from "@comps/Screen";
import type { PreparedSendOperation, SendOperation } from "@cashu/coco-core";
import { useSendOperation } from "@cashu/coco-react";
import SendConfirmationModal, { type SendConfirmationModalRef } from "@modal/SendConfirmationModal";
import { useCurrencyContext } from "@src/context/Currency";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import type { TBeforeRemoveEvent } from "@model/nav";
import { SendSelectAmountProps } from "@src/nav/navTypes";
import { usePromptContext } from "@src/context/Prompt";
import { AppText, useAppThemeTokens, Stack } from "@styles";
import { isErr, vib } from "@util";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet, type TextInput } from "react-native";
type TPreparedOrLaterSendOperation = Exclude<
  SendOperation,
  {
    state: "init";
  }
>;
function isPreparedOrLaterSendOperation(
  operation: SendOperation | null,
): operation is TPreparedOrLaterSendOperation {
  return !!operation && operation.state !== "init";
}
export default function SendSelectAmountScreen({ navigation }: SendSelectAmountProps) {
  const { t } = useTranslation([NS.wallet, NS.common, NS.error]);
  const theme = useAppThemeTokens();
  const { shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const amountInputRef = useRef<TextInput>(null);
  const sendConfirmationRef = useRef<SendConfirmationModalRef>(null);
  const {
    cancel,
    currentOperation,
    execute,
    isLoading: isSending,
    prepare,
    reset,
  } = useSendOperation();
  const { openPromptAutoClose } = usePromptContext();
  const [amountInput, setAmountInput] = useState("");
  const [preparedOperation, setPreparedOperation] = useState<PreparedSendOperation | null>(null);
  const [preparedMint, setPreparedMint] = useState<KnownMintWithBalance | null>(null);
  const hasCancelledRef = useRef(false);
  const selectableMints = useMemo(() => {
    return knownMints.filter((mint) => mint.balance > 0);
  }, [knownMints]);
  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    selectableMints[0] ?? null,
  );
  useEffect(() => {
    setSelectedMint((currentMint) => {
      const updatedMint = currentMint
        ? selectableMints.find((mint) => mint.mintUrl === currentMint.mintUrl)
        : null;
      return updatedMint ?? selectableMints[0] ?? null;
    });
  }, [selectableMints]);
  const displayOperation = isPreparedOrLaterSendOperation(currentOperation)
    ? currentOperation
    : preparedOperation;
  const canCancelPreparedOperation = displayOperation?.state === "prepared";
  const noMintsAvailable = useMemo(() => {
    return !selectedMint || selectableMints.length === 0;
  }, [selectedMint, selectableMints.length]);
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
  const handleBack = useCallback(() => {
    if (displayOperation) {
      sendConfirmationRef.current?.close({ notifyCancel: true });
      return;
    }
    navigation.goBack();
  }, [displayOperation, navigation]);
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
  const showError = useCallback(
    (error: unknown) => {
      console.error(error);
      openPromptAutoClose({
        msg: isErr(error) ? error.message : t("sendTokenErr", { ns: NS.error }),
      });
    },
    [openPromptAutoClose, t],
  );
  const presentSendConfirmation = useCallback(() => {
    amountInputRef.current?.blur();
    Keyboard.dismiss();
    setTimeout(() => {
      sendConfirmationRef.current?.present();
    }, 0);
  }, []);
  const handleAmountSubmit = useCallback(async () => {
    if (isSending || !selectedMint) {
      return;
    }
    if (!amountValue || amountValue < 1 || amountValue > selectedMintBalance) {
      triggerAmountError();
      return;
    }
    try {
      const operation = await prepare({ mintUrl: selectedMint.mintUrl, amount: amountValue });
      hasCancelledRef.current = false;
      setPreparedMint(selectedMint);
      setPreparedOperation(operation);
      presentSendConfirmation();
    } catch (e) {
      showError(e);
      shake();
    }
  }, [
    amountValue,
    isSending,
    prepare,
    presentSendConfirmation,
    selectedMint,
    selectedMintBalance,
    shake,
    showError,
    triggerAmountError,
  ]);
  const handleOperationConfirm = useCallback(async () => {
    if (!displayOperation) {
      return;
    }
    try {
      const { token } = await execute();
      sendConfirmationRef.current?.close({ notifyCancel: false });
      setPreparedOperation(null);
      setPreparedMint(null);
      navigation.navigate("encodedToken", {
        token,
      });
    } catch (e) {
      showError(e);
      shake();
    }
  }, [displayOperation, execute, navigation, shake, showError]);
  const cancelPreparedOperation = useCallback(async () => {
    if (!canCancelPreparedOperation || isSending || hasCancelledRef.current) {
      return true;
    }
    try {
      hasCancelledRef.current = true;
      await cancel();
      setPreparedOperation(null);
      setPreparedMint(null);
      reset();
      return true;
    } catch (error) {
      hasCancelledRef.current = false;
      showError(error);
      return false;
    }
  }, [canCancelPreparedOperation, cancel, isSending, reset, showError]);
  const handleOperationCancel = useCallback(async () => {
    const didCancel = await cancelPreparedOperation();
    if (!didCancel) {
      presentSendConfirmation();
    }
  }, [cancelPreparedOperation, presentSendConfirmation]);
  useEffect(() => {
    const handleBeforeRemove = (e: TBeforeRemoveEvent) => {
      if (!canCancelPreparedOperation || hasCancelledRef.current) {
        return;
      }
      e.preventDefault();
      if (isSending) {
        return;
      }
      void cancelPreparedOperation().then((didCancel) => {
        if (didCancel) {
          navigation.dispatch(e.data.action);
        }
      });
    };
    return navigation.addListener("beforeRemove", handleBeforeRemove);
  }, [canCancelPreparedOperation, cancelPreparedOperation, isSending, navigation]);
  // Early return after all hooks
  if (noMintsAvailable) {
    return (
      <Screen
        screenName={t("selectAmount", { ns: NS.common })}
        withBackBtn
        handlePress={handleBack}
      >
        <Stack
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <AppText testID={`${t("noMintsWithBalance", { ns: NS.common })}-txt`}>
            {t("noMintsWithBalance", { ns: NS.common })}
          </AppText>
        </Stack>
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
        />
      }
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

      <Stack style={styles.actionWrap}>
        <Button
          txt={t("continue", { ns: NS.common })}
          onPress={handleAmountSubmit}
          icon={<ChevronRightIcon color={theme.white} />}
          loading={isSending}
        />
      </Stack>

      <SendConfirmationModal
        ref={sendConfirmationRef}
        operation={displayOperation}
        mint={preparedMint}
        loading={isSending}
        onConfirm={() => void handleOperationConfirm()}
        onCancel={() => void handleOperationCancel()}
      />
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
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const total = shouldEstimate ? 0 : amount + fee;
  const { formatted, symbol } = formatAmount(total);
  return (
    <Stack style={styles.overview}>
      <AppText
        weight="medium"
        testID={`${
          t(isInvoice ? "invoiceInclFee" : "totalInclFee", {
            ns: NS.common,
          }) + "*"
        }-txt`}
      >
        {t(isInvoice ? "invoiceInclFee" : "totalInclFee", {
          ns: NS.common,
        }) + "*"}
      </AppText>
      <AppText
        style={[
          {
            color:
              !shouldEstimate && balTooLow
                ? theme.error
                : shouldEstimate
                  ? theme.text
                  : theme.valid,
          },
        ]}
        testID={`${`${formatted} ${symbol}`}-txt`}
      >{`${formatted} ${symbol}`}</AppText>
    </Stack>
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
