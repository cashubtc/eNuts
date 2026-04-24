import Button from "@comps/Button";
import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Card from "@comps/Card";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import MintHeaderSelector from "@comps/MintHeaderSelector";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon } from "@comps/Icons";
import type { MeltOperation } from "@cashu/coco-core";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl, getStrFromClipboard, isErr, vib } from "@util";
import { isLightningAddress, isLnurl } from "@util/lnurl";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TextInput, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import MeltConfirmationModal, { type MeltConfirmationModalRef } from "@modal/MeltConfirmationModal";

import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import type { TBeforeRemoveEvent } from "@model/nav";
import { MeltInputProps } from "@src/nav/navTypes";
import Screen from "@comps/Screen";
import {
  getInvoiceFromLnAddress,
  requestLnAddressMetadata,
  type LnAddressMetadata,
} from "@src/util/lud16";
import { useMeltOperation } from "@cashu/coco-react";

type TFinalizedMeltOperation = Extract<MeltOperation, { state: "finalized" }>;

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
  const [lnAddressMetadata, setLnAddressMetadata] = useState<LnAddressMetadata | null>(null);
  const [lnAddressLoading, setLnAddressLoading] = useState(false);
  const [lnAddressMetadataError, setLnAddressMetadataError] = useState(false);

  // Use refs for better performance
  const inputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);
  const meltConfirmationRef = useRef<MeltConfirmationModalRef>(null);
  const hasNavigatedRef = useRef(false);
  const hasCancelledRef = useRef(false);
  const lnAddressRequestRef = useRef(0);

  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { color } = useThemeContext();
  const { shake } = useShakeAnimation();
  const [input, setInput] = useState(invoice || "");
  const [debouncedInput, setDebouncedInput] = useState(invoice || "");
  const trimmedInput = input.trim();
  const debouncedTrimmedInput = debouncedInput.trim();
  const isCurrentLnAddressInput = useMemo(() => isLightningAddress(trimmedInput), [trimmedInput]);
  const isLnAddressInput = useMemo(
    () => isLightningAddress(debouncedTrimmedInput),
    [debouncedTrimmedInput],
  );
  const isLnAddressMetadataCurrent =
    isCurrentLnAddressInput && debouncedTrimmedInput === trimmedInput;
  const hasCurrentLnAddressMetadata = isLnAddressMetadataCurrent && !!lnAddressMetadata;
  const displayOperation = currentOperation || preparedOperation;
  const canCancelPreparedOperation = displayOperation?.state === "prepared";
  const isBusy = loading || operationLoading;
  const isCurrentLnAddressLoading = isCurrentLnAddressInput && lnAddressLoading;

  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);

  const isAmountInvalid = useMemo(() => {
    if (!isCurrentLnAddressInput) {
      return false;
    }

    const amountInMsats = amountValue * 1000;
    const isAmountTooLow = amountValue < 1;
    const isBelowMin =
      !!lnAddressMetadata?.minSendable && lnAddressMetadata.minSendable > amountInMsats;
    const isAboveMax =
      !!lnAddressMetadata?.maxSendable && lnAddressMetadata.maxSendable < amountInMsats;

    return isAmountTooLow || isBelowMin || isAboveMax;
  }, [amountValue, isCurrentLnAddressInput, lnAddressMetadata]);

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
      setTimeout(() => {
        meltConfirmationRef.current?.present();
      }, 0);
    }
  }, [cancelPreparedOperation]);

  const handleBackToDashboard = useCallback(() => {
    navigation.navigate("dashboard");
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (displayOperation) {
      meltConfirmationRef.current?.close({ notifyCancel: true });
      return;
    }

    navigation.goBack();
  }, [displayOperation, navigation]);

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

  const handleBtnPress = async () => {
    const currentMint = selectedMint;
    if (isBusy || !currentMint) {
      return;
    }
    // user pasted an encoded LNURL, we need to get the amount by the user
    if (isLnurl(trimmedInput)) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    }

    const currentLnAddressMetadata = isLnAddressMetadataCurrent ? lnAddressMetadata : null;
    const currentIsLnAddressInput = isLightningAddress(trimmedInput);
    let lnAddressMetadataToUse: LnAddressMetadata | null = null;

    if (currentIsLnAddressInput) {
      if (!currentLnAddressMetadata || isAmountInvalid) {
        triggerAmountError();
        return;
      }

      lnAddressMetadataToUse = currentLnAddressMetadata;
    }

    startLoading();
    try {
      const invoiceToPrepare = lnAddressMetadataToUse
        ? await getInvoiceFromLnAddress(lnAddressMetadataToUse, amountValue * 1000)
        : trimmedInput;

      const operation = await prepare({
        mintUrl: currentMint.mintUrl,
        method: "bolt11",
        methodData: { invoice: invoiceToPrepare },
      });
      hasCancelledRef.current = false;
      hasNavigatedRef.current = false;
      setPreparedMint(currentMint);
      setPreparedOperation(operation);
      setTimeout(() => {
        meltConfirmationRef.current?.present();
      }, 0);
    } catch (e) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedInput(input);
    }, 500);

    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    if (!isLnAddressInput) {
      lnAddressRequestRef.current += 1;
      setLnAddressMetadata(null);
      setLnAddressMetadataError(false);
      setLnAddressLoading(false);
      return;
    }

    const requestId = lnAddressRequestRef.current + 1;
    lnAddressRequestRef.current = requestId;
    setLnAddressMetadata(null);
    setLnAddressMetadataError(false);
    setLnAddressLoading(true);

    void requestLnAddressMetadata(debouncedTrimmedInput)
      .then((metadata) => {
        if (lnAddressRequestRef.current !== requestId) {
          return;
        }

        setLnAddressMetadata(metadata);
      })
      .catch(() => {
        if (lnAddressRequestRef.current !== requestId) {
          return;
        }

        setLnAddressMetadataError(true);
      })
      .finally(() => {
        if (lnAddressRequestRef.current === requestId) {
          setLnAddressLoading(false);
        }
      });

    return () => {
      lnAddressRequestRef.current += 1;
    };
  }, [debouncedTrimmedInput, isLnAddressInput]);

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
        mintBalance={0}
        disableMintBalance
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
        {/* Input field */}
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
        />

        {isLnAddressInput ? (
          <>
            <AmountInput
              ref={amountInputRef}
              value={amountInput}
              onChange={setAmountInput}
              onSubmit={handleBtnPress}
              error={amountErr}
              autoFocus={false}
              testID="melt-ln-address-amount-input"
            />
            <Card style={styles.lnAddressCard}>
              <View style={styles.addressSection}>
                <Txt txt={trimmedInput} styles={[styles.addressText]} bold />
              </View>

              {isLnAddressMetadataCurrent && lnAddressLoading ? (
                <View style={styles.metadataLoading}>
                  <Loading size={18} />
                </View>
              ) : null}

              {isLnAddressMetadataCurrent && lnAddressMetadataError ? (
                <Txt txt={t("invalidInvoice")} styles={[styles.errorText]} />
              ) : null}

              {hasCurrentLnAddressMetadata &&
              (lnAddressMetadata.minSendable || lnAddressMetadata.maxSendable) ? (
                <View style={[styles.amountRangeSection, { borderTopColor: color.BORDER }]}>
                  {lnAddressMetadata.minSendable ? (
                    <View style={styles.rangeItem}>
                      <Txt
                        txt="Min"
                        styles={[styles.rangeLabel, { color: color.TEXT_SECONDARY }]}
                      />
                      <Txt
                        txt={`${Math.floor(lnAddressMetadata.minSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  ) : null}
                  {lnAddressMetadata.maxSendable ? (
                    <View style={styles.rangeItem}>
                      <Txt
                        txt="Max"
                        styles={[styles.rangeLabel, { color: color.TEXT_SECONDARY }]}
                      />
                      <Txt
                        txt={`${Math.floor(lnAddressMetadata.maxSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </>
        ) : null}
      </ScrollView>

      {/* Paste and Continue Buttons at bottom */}
      <View style={styles.actionWrap}>
        <View style={{ width: "100%", gap: vs(10), paddingBottom: vs(10) }}>
          <Button txt={t("paste")} onPress={() => void handlePaste()} ghost />
          <Button
            disabled={
              isBusy ||
              isCurrentLnAddressLoading ||
              !trimmedInput.length ||
              (isCurrentLnAddressInput &&
                (!hasCurrentLnAddressMetadata || !amountValue || isAmountInvalid))
            }
            txt={t("continue")}
            onPress={() => void handleBtnPress()}
            icon={isBusy ? <Loading size={20} /> : <ChevronRightIcon color={mainColors.WHITE} />}
          />
        </View>
      </View>

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

const styles = ScaledSheet.create({
  contentContainer: {
    gap: "8@vs",
    paddingBottom: "16@vs",
  },
  formScroll: {
    flex: 1,
  },
  lnAddressCard: {
    gap: "10@vs",
    paddingHorizontal: "16@s",
    paddingVertical: "14@vs",
  },
  addressSection: {
    width: "100%",
  },
  addressText: {
    fontSize: "14@ms",
    flexShrink: 1,
  },
  metadataLoading: {
    alignItems: "flex-start",
    paddingTop: "2@vs",
  },
  amountRangeSection: {
    flexDirection: "row",
    gap: "25@s",
    paddingTop: "10@vs",
    borderTopWidth: 1,
  },
  rangeItem: {
    gap: "3@vs",
  },
  rangeLabel: {
    fontSize: "10@ms",
    textTransform: "uppercase",
  },
  rangeValue: {
    fontSize: "13@ms",
  },
  errorText: {
    color: mainColors.ERROR,
    fontSize: "13@ms",
  },
  actionWrap: {
    width: "100%",
  },
});
