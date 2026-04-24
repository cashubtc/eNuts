import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon, ScanQRIcon } from "@comps/Icons";
// Lazy load the MintSelectionSheet to improve initial render
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import type { MeltOperation } from "@cashu/coco-core";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi, mainColors } from "@styles";
import { formatMintUrl, getStrFromClipboard, isErr } from "@util";
import { isLightningAddress, isLnurl } from "@util/lnurl";
import { useEffect, useState, useRef, useCallback, lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MeltConfirmationModal, { type MeltConfirmationModalRef } from "@modal/MeltConfirmationModal";

import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import type { TBeforeRemoveEvent } from "@model/nav";
import { MeltInputProps } from "@src/nav/navTypes";
import Screen from "@comps/Screen";
import MintSelector from "@comps/MintSelector";
import { requestLnAddressMetadata } from "@src/util/lud16";
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

  // Use refs for better performance
  const inputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);
  const meltConfirmationRef = useRef<MeltConfirmationModalRef>(null);
  const hasNavigatedRef = useRef(false);
  const hasCancelledRef = useRef(false);

  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { highlight } = useThemeContext();
  const [input, setInput] = useState(invoice || "");
  const displayOperation = currentOperation || preparedOperation;
  const canCancelPreparedOperation = displayOperation?.state === "prepared";
  const isBusy = loading || operationLoading;

  // Check if we have mints available
  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  // Mint selection handlers
  const handleMintSelectionOpen = useCallback(() => {
    // Blur the input when opening the sheet
    inputRef.current?.blur();

    // Try expand method first, fallback to snapToIndex
    if (mintSelectionSheetRef.current) {
      try {
        mintSelectionSheetRef.current.present();
      } catch (error) {
        /* ignore */
      }
    }
  }, []);

  const handleMintSelect = useCallback(
    (mint: KnownMintWithBalance) => {
      setSelectedMint(mint);
    },
    [setSelectedMint],
  );

  // Paste from clipboard
  const handlePaste = async () => {
    const clipboard = await getStrFromClipboard();
    if (!clipboard) {
      return;
    }
    setInput(clipboard);
  };

  // Navigate to QR scanner
  const handleScanQR = useCallback(() => {
    navigation.replace("QRScanner");
  }, [navigation]);

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
    if (isLnurl(input)) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    }

    startLoading();
    if (isLightningAddress(input)) {
      try {
        inputRef.current?.blur();
        await new Promise((resolve) => setTimeout(resolve, 400));
        const metadata = await requestLnAddressMetadata(input);
        return navigation.navigate("MeltLnAddress", {
          lnAddress: input,
          metadata,
          selectedMint: currentMint.mintUrl,
        });
      } catch (e) {
        return openPromptAutoClose({ msg: t("invalidInvoice") });
      } finally {
        stopLoading();
      }
    }
    try {
      const operation = await prepare({
        mintUrl: currentMint.mintUrl,
        method: "bolt11",
        methodData: { invoice: input },
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
        <TouchableOpacity onPress={handleScanQR} style={{ paddingHorizontal: 20 }}>
          <ScanQRIcon color={hi[highlight]} />
        </TouchableOpacity>
      }
    >
      <View style={styles.contentContainer}>
        {/* Mint Selection at the top */}
        <MintSelector
          mint={selectedMint!}
          onPress={handleMintSelectionOpen}
          label={t("selectMint")}
        />

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
      </View>

      {/* Paste and Continue Buttons at bottom */}
      <View style={styles.actionWrap}>
        <View style={{ width: "100%", gap: vs(10), paddingBottom: vs(10) }}>
          <Button txt={t("paste")} onPress={() => void handlePaste()} ghost />
          <Button
            disabled={isBusy || !input.length}
            txt={t("continue")}
            onPress={() => void handleBtnPress()}
            icon={isBusy ? <Loading size={20} /> : <ChevronRightIcon color={mainColors.WHITE} />}
          />
        </View>
      </View>

      {/* Mint Selection Sheet */}
      <Suspense fallback={<View />}>
        <MintSelectionSheet
          ref={mintSelectionSheetRef}
          selectedMint={selectedMint!}
          onMintSelect={handleMintSelect}
          multiSelect={false}
        />
      </Suspense>

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
  },
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
});
