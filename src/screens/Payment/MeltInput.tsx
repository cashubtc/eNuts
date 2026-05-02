import Button from "@comps/Button";
import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import MintHeaderSelector from "@comps/MintHeaderSelector";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { BoltIcon, ChevronRightIcon, CopyIcon } from "@comps/Icons";
import type { MeltOperation } from "@cashu/coco-core";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi, mainColors } from "@styles";
import { formatMintUrl, getStrFromClipboard, isErr, vib } from "@util";
import { isLightningAddress, isLnurl } from "@util/lnurl";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import MeltConfirmationModal, { type MeltConfirmationModalRef } from "@modal/MeltConfirmationModal";

import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import type { TBeforeRemoveEvent } from "@model/nav";
import { MeltInputProps } from "@src/nav/navTypes";
import Screen from "@comps/Screen";
import {
  getInvoiceFromLnAddress,
  requestLnurlPayMetadata,
  type LnAddressMetadata,
} from "@src/util/lud16";
import { useMeltOperation } from "@cashu/coco-react";

type TFinalizedMeltOperation = Extract<MeltOperation, { state: "finalized" }>;
type TMeltInputStep = "request" | "amount";

export default function MeltInputScreen({ navigation, route }: MeltInputProps) {
  const { invoice } = route.params || {};
  const { knownMints } = useKnownMints();
  const {
    cancel,
    currentOperation,
    execute,
    isLoading: operationLoading,
    prepare,
    reset,
  } = useMeltOperation();

  const { loading, startLoading, stopLoading } = useLoading();

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    knownMints.length > 0 ? knownMints[0] : null,
  );
  const [preparedOperation, setPreparedOperation] = useState<MeltOperation | null>(null);
  const [preparedMint, setPreparedMint] = useState<KnownMintWithBalance | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [amountErr, setAmountErr] = useState(false);
  const [inputStep, setInputStep] = useState<TMeltInputStep>("request");
  const [lnAddress, setLnAddress] = useState("");
  const [lnAddressMetadata, setLnAddressMetadata] = useState<LnAddressMetadata | null>(null);

  // Use refs for better performance
  const inputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);
  const meltConfirmationRef = useRef<MeltConfirmationModalRef>(null);
  const hasNavigatedRef = useRef(false);
  const hasCancelledRef = useRef(false);
  const lnAddressAnim = useRef(new Animated.Value(0)).current;

  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { color, highlight } = useThemeContext();
  const { shake } = useShakeAnimation();
  const [input, setInput] = useState(invoice || "");
  const trimmedInput = input.trim();
  const isAmountStep = inputStep === "amount";
  const displayOperation = currentOperation || preparedOperation;
  const canCancelPreparedOperation = displayOperation?.state === "prepared";
  const isBusy = loading || operationLoading;

  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);

  const isAmountInvalid = useMemo(() => {
    if (!isAmountStep) {
      return false;
    }

    const amountInMsats = amountValue * 1000;
    const isAmountTooLow = amountValue < 1;
    const isBelowMin =
      !!lnAddressMetadata?.minSendable && lnAddressMetadata.minSendable > amountInMsats;
    const isAboveMax =
      !!lnAddressMetadata?.maxSendable && lnAddressMetadata.maxSendable < amountInMsats;

    return isAmountTooLow || isBelowMin || isAboveMax;
  }, [amountValue, isAmountStep, lnAddressMetadata]);

  const minSendable = lnAddressMetadata?.minSendable;
  const maxSendable = lnAddressMetadata?.maxSendable;
  const shouldShowAmountLimits = isAmountStep && (!!minSendable || !!maxSendable);
  const isContinueLoading = isBusy;
  const isContinueDisabled =
    isBusy ||
    (isAmountStep ? !lnAddressMetadata || !amountValue || isAmountInvalid : !trimmedInput.length);

  // Check if we have mints available
  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  const handleMintSelect = useCallback(
    (mint: KnownMintWithBalance) => {
      setSelectedMint(mint);
    },
    [setSelectedMint],
  );

  const handleMintSelectorOpen = useCallback(() => {
    inputRef.current?.blur();
    amountInputRef.current?.blur();
  }, []);

  // Paste from clipboard
  const handlePaste = async () => {
    if (isAmountStep) {
      return;
    }

    const clipboard = await getStrFromClipboard();
    if (!clipboard) {
      return;
    }
    setInput(clipboard);
  };

  const triggerAmountError = useCallback(() => {
    vib(400);
    setAmountErr(true);
    shake();
    const timeout = setTimeout(() => {
      setAmountErr(false);
      clearTimeout(timeout);
    }, 500);
  }, [shake]);

  const showError = useCallback(
    (error: unknown) => {
      if (isErr(error)) {
        openPromptAutoClose({ msg: error.message || t("invalidInvoice") });
        return;
      }

      console.error(error);
      openPromptAutoClose({ msg: t("invalidInvoice") });
    },
    [openPromptAutoClose, t],
  );

  const presentMeltConfirmation = useCallback(() => {
    inputRef.current?.blur();
    amountInputRef.current?.blur();
    Keyboard.dismiss();

    setTimeout(() => {
      meltConfirmationRef.current?.present();
    }, 0);
  }, []);

  const navigateToSuccess = useCallback(
    (finalizedOperation: TFinalizedMeltOperation) => {
      if (hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;
      meltConfirmationRef.current?.close({ notifyCancel: false });

      const mintName =
        preparedMint?.mintInfo.name ||
        preparedMint?.name ||
        formatMintUrl(preparedMint?.mintUrl || finalizedOperation.mintUrl);

      setPreparedOperation(null);
      setPreparedMint(null);

      navigation.navigate("successScreen", {
        type: "melt",
        mint: mintName,
        amount: finalizedOperation.amount,
        fee: finalizedOperation.effectiveFee ?? finalizedOperation.fee_reserve,
        change: finalizedOperation.changeAmount,
      });
    },
    [navigation, preparedMint],
  );

  const cancelPreparedOperation = useCallback(async () => {
    if (!canCancelPreparedOperation || operationLoading || hasCancelledRef.current) {
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
  }, [canCancelPreparedOperation, cancel, operationLoading, reset, showError]);

  const handleOperationCancel = useCallback(async () => {
    const didCancel = await cancelPreparedOperation();
    if (!didCancel) {
      presentMeltConfirmation();
    }
  }, [cancelPreparedOperation, presentMeltConfirmation]);

  const handleBackToDashboard = useCallback(() => {
    navigation.navigate("dashboard");
  }, [navigation]);

  const handleCancelLnAddress = useCallback(() => {
    amountInputRef.current?.blur();
    Keyboard.dismiss();
    setInputStep("request");
    setLnAddress("");
    setLnAddressMetadata(null);
    setAmountInput("");
    setAmountErr(false);
  }, []);

  const handleBack = useCallback(() => {
    if (displayOperation) {
      meltConfirmationRef.current?.close({ notifyCancel: true });
      return;
    }

    if (isAmountStep) {
      handleCancelLnAddress();
      return;
    }

    navigation.goBack();
  }, [displayOperation, handleCancelLnAddress, isAmountStep, navigation]);

  const handleOperationConfirm = useCallback(async () => {
    if (!displayOperation) {
      return;
    }

    try {
      await execute();
    } catch (error) {
      showError(error);
    }
  }, [displayOperation, execute, showError]);

  const prepareMelt = useCallback(
    async (invoiceToPrepare: string, currentMint: KnownMintWithBalance) => {
      const operation = await prepare({
        mintUrl: currentMint.mintUrl,
        method: "bolt11",
        methodData: { invoice: invoiceToPrepare },
      });

      hasCancelledRef.current = false;
      hasNavigatedRef.current = false;
      setPreparedMint(currentMint);
      setPreparedOperation(operation);
      presentMeltConfirmation();
    },
    [prepare, presentMeltConfirmation],
  );

  const handleBtnPress = async () => {
    const currentMint = selectedMint;
    if (isBusy || !currentMint) {
      return;
    }

    if (isAmountStep) {
      if (!lnAddressMetadata || isAmountInvalid) {
        triggerAmountError();
        return;
      }

      startLoading();
      try {
        const invoiceToPrepare = await getInvoiceFromLnAddress(
          lnAddressMetadata,
          amountValue * 1000,
        );
        await prepareMelt(invoiceToPrepare, currentMint);
      } catch (e) {
        return openPromptAutoClose({ msg: t("invalidInvoice") });
      } finally {
        stopLoading();
      }
      return;
    }

    // user pasted an encoded LNURL, we need to get the amount by the user
    if (isLnurl(trimmedInput)) {
      startLoading();
      try {
        const metadata = await requestLnurlPayMetadata(trimmedInput);
        setLnAddress(trimmedInput);
        setLnAddressMetadata(metadata);
        setAmountInput("");
        setAmountErr(false);
        setInputStep("amount");
        inputRef.current?.blur();
      } catch (e) {
        return openPromptAutoClose({ msg: t("invalidInvoice") });
      } finally {
        stopLoading();
      }

      return;
    }

    if (isLightningAddress(trimmedInput)) {
      startLoading();
      try {
        const metadata = await requestLnurlPayMetadata(trimmedInput);
        setLnAddress(trimmedInput);
        setLnAddressMetadata(metadata);
        setAmountInput("");
        setAmountErr(false);
        setInputStep("amount");
        inputRef.current?.blur();
      } catch (e) {
        return openPromptAutoClose({ msg: t("invalidInvoice") });
      } finally {
        stopLoading();
      }

      return;
    }

    startLoading();
    try {
      await prepareMelt(trimmedInput, currentMint);
    } catch (e) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    } finally {
      stopLoading();
    }
  };

  const lnAddressMotionStyle = {
    opacity: lnAddressAnim,
    transform: [
      {
        translateY: lnAddressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  useEffect(() => {
    if (!isAmountStep) {
      lnAddressAnim.setValue(0);
      return;
    }

    Animated.timing(lnAddressAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isAmountStep, lnAddressAnim]);

  useEffect(() => {
    if (currentOperation?.state === "finalized") {
      navigateToSuccess(currentOperation);
    }
  }, [currentOperation, navigateToSuccess]);

  useEffect(() => {
    const handleBeforeRemove = (e: TBeforeRemoveEvent) => {
      if (!canCancelPreparedOperation || hasCancelledRef.current) {
        return;
      }

      e.preventDefault();

      if (operationLoading) {
        return;
      }

      void cancelPreparedOperation().then((didCancel) => {
        if (didCancel) {
          navigation.dispatch(e.data.action);
        }
      });
    };

    return navigation.addListener("beforeRemove", handleBeforeRemove);
  }, [canCancelPreparedOperation, cancelPreparedOperation, navigation, operationLoading]);

  // auto-focus keyboard
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      clearTimeout(t);
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Early return if no mints available
  if (noMintsAvailable) {
    return (
      <Screen
        screenName={t("cashOut")}
        withBackBtn
        handlePress={handleBack}
        withCancelBtn
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
      screenName={t("cashOut")}
      withBackBtn
      handlePress={handleBack}
      withPadding={true}
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
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isAmountStep ? (
          <View
            key="request-input"
            style={[
              styles.inputSurface,
              {
                backgroundColor: color.DRAWER,
                borderColor: color.BORDER,
              },
            ]}
          >
            <View style={styles.inputRow}>
              <TxtInput
                innerRef={inputRef}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("invoiceOrLnAddress")}
                value={input}
                onChangeText={(text) => {
                  setInput(text);
                }}
                onSubmitEditing={() => void handleBtnPress()}
                autoFocus
                ms={200}
                style={styles.inputField}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("paste")}
                activeOpacity={0.7}
                onPress={() => void handlePaste()}
                style={[
                  styles.pasteButton,
                  {
                    backgroundColor: color.INPUT_BG,
                    borderColor: color.BORDER,
                  },
                ]}
              >
                <CopyIcon width={18} height={18} color={hi[highlight]} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Animated.View
            key="ln-address-amount"
            style={[
              styles.lnAddressPanel,
              {
                backgroundColor: color.DRAWER,
                borderColor: color.BORDER,
              },
              lnAddressMotionStyle,
            ]}
          >
            <View style={styles.panelHeader}>
              <View style={[styles.panelIcon, { backgroundColor: color.INPUT_BG }]}>
                <BoltIcon width={18} height={18} color={hi[highlight]} />
              </View>
              <View style={styles.panelCopy}>
                <Txt txt={t("amount", { ns: NS.common })} bold styles={[styles.panelTitle]} />
                <Txt
                  txt={lnAddress}
                  styles={[styles.addressText, { color: color.TEXT_SECONDARY }]}
                />
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("cancel", { ns: NS.common })}
                activeOpacity={0.7}
                onPress={handleCancelLnAddress}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: color.INPUT_BG,
                    borderColor: color.BORDER,
                  },
                ]}
              >
                <Txt
                  txt={t("cancel", { ns: NS.common })}
                  bold
                  styles={[styles.cancelText, { color: hi[highlight] }]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.amountStage}>
              <View style={[styles.amountDivider, { backgroundColor: color.DARK_BORDER }]} />
              <AmountInput
                ref={amountInputRef}
                value={amountInput}
                onChange={setAmountInput}
                onSubmit={handleBtnPress}
                error={amountErr}
                autoFocus
                compact
                testID="melt-ln-address-amount-input"
              />
            </View>

            {shouldShowAmountLimits ? (
              <View style={[styles.amountRangeSection, { borderTopColor: color.DARK_BORDER }]}>
                <Txt
                  txt={t("amountLimits", { ns: NS.common })}
                  bold
                  styles={[styles.rangeTitle, { color: color.TEXT }]}
                />
                <View style={styles.rangeGrid}>
                  {minSendable ? (
                    <View style={[styles.rangeItem, { backgroundColor: color.INPUT_BG }]}>
                      <Txt
                        txt="Min"
                        styles={[styles.rangeLabel, { color: color.TEXT_SECONDARY }]}
                      />
                      <Txt
                        txt={`${Math.floor(minSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  ) : null}
                  {maxSendable ? (
                    <View style={[styles.rangeItem, { backgroundColor: color.INPUT_BG }]}>
                      <Txt
                        txt="Max"
                        styles={[styles.rangeLabel, { color: color.TEXT_SECONDARY }]}
                      />
                      <Txt
                        txt={`${Math.floor(maxSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </Animated.View>
        )}

        <View style={styles.actionWrap}>
          <Button
            disabled={isContinueDisabled}
            txt={t("continue")}
            onPress={() => void handleBtnPress()}
            icon={
              isContinueLoading ? (
                <Loading size={20} />
              ) : (
                <ChevronRightIcon color={mainColors.WHITE} />
              )
            }
          />
        </View>
      </ScrollView>

      {displayOperation ? (
        <MeltConfirmationModal
          ref={meltConfirmationRef}
          operation={displayOperation}
          mint={preparedMint}
          loading={operationLoading}
          onConfirm={() => void handleOperationConfirm()}
          onCancel={() => void handleOperationCancel()}
          onBackToDashboard={handleBackToDashboard}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    gap: 12,
    paddingTop: 6,
    paddingBottom: 14,
  },
  formScroll: {
    flex: 1,
  },
  inputSurface: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputField: {
    flex: 1,
    width: "auto",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 16,
  },
  pasteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lnAddressPanel: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  panelIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  panelCopy: {
    flex: 1,
    gap: 3,
  },
  panelTitle: {
    fontSize: 14,
  },
  cancelButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelText: {
    fontSize: 11,
  },
  amountStage: {
    width: "100%",
    paddingTop: 6,
  },
  amountDivider: {
    height: 1,
    width: "100%",
    marginBottom: 1,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
  },
  amountRangeSection: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  rangeTitle: {
    fontSize: 12,
  },
  rangeGrid: {
    flexDirection: "row",
    gap: 10,
  },
  rangeItem: {
    flex: 1,
    gap: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rangeLabel: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  rangeValue: {
    fontSize: 13,
  },
  actionWrap: {
    width: "100%",
    marginTop: "auto",
    paddingTop: 14,
  },
});
