import { useShakeAnimation } from "@comps/animation/Shake";
import Button, { IconBtn } from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import type { TSelectAmountPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatSatStr, isErr, vib } from "@util";
import { useCallback, useRef, useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Animated, TextInput, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useManager } from "@src/context/Manager";
import { SendSelectAmountProps } from "@src/nav/navTypes";
import { useSend } from "coco-cashu-react";
import { usePromptContext } from "@src/context/Prompt";
import MintSelector from "@comps/MintSelector";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function SendSelectAmountScreen({
  navigation,
}: SendSelectAmountProps) {
  const { t } = useTranslation([NS.wallet]);
  const { color, highlight } = useThemeContext();
  const { anim, shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const manager = useManager();
  // Use useRef instead of createRef to avoid recreation on every render
  const numericInputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);
  const { isSending, isError: isSendError, send } = useSend();
  const { openPromptAutoClose } = usePromptContext();

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

  // Memoize style objects to prevent recreation
  const globalStyles = useMemo(() => globals(), []);

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
    [setSelectedMint]
  );

  const handleMintSelectionOpen = useCallback(() => {
    // Blur the text inputs when opening the sheet
    numericInputRef.current?.blur();

    // Try expand method first, fallback to snapToIndex
    if (mintSelectionSheetRef.current) {
      try {
        mintSelectionSheetRef.current.present();
      } catch (error) {
        /* ignore */
      }
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    // Close the mint selection sheet when input is focused
    mintSelectionSheetRef.current?.dismiss();
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    const sanitized = text.replace(/\D/g, "");
    setAmountInput(sanitized);
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
    const token = await send(selectedMint.mintUrl, amountValue, {
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
  }, [amountValue, selectedMint, manager, navigation, selectedMintBalance]);

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
      <View style={[styles.overviewWrap, { marginTop: vs(20) }]}>
        <Animated.View
          style={[
            styles.amountWrap,
            { transform: [{ translateX: anim.current }] },
          ]}
        >
          <TextInput
            keyboardType="numeric"
            ref={numericInputRef}
            placeholder="0"
            autoFocus
            cursorColor={hi[highlight]}
            placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
            style={[
              globalStyles.selectAmount,
              { color: err ? mainColors.ERROR : hi[highlight] },
            ]}
            onChangeText={handleAmountChange}
            onSubmitEditing={handleAmountSubmit}
            onFocus={handleInputFocus}
            value={amountInput}
            maxLength={8}
            testID="mint-amount-input"
          />
        </Animated.View>
        <Txt
          txt={formatSatStr(amountValue, "standard", false)}
          styles={[styles.sats, { color: color.TEXT_SECONDARY }]}
        />
      </View>

      {/* Mint Selection and Memo Input */}
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
            onPress={handleAmountSubmit}
            icon={<ChevronRightIcon color={mainColors.WHITE} />}
            disabled={isSending}
          />
        </View>
      </KeyboardAvoidingView>

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
  headerHint: {
    paddingHorizontal: "20@s",
    marginBottom: "20@vs",
    fontWeight: "500",
  },
  amountWrap: {
    width: "100%",
    alignItems: "center",
  },
  continue: {
    flex: 1,
    position: "absolute",
    right: "20@s",
    left: "20@s",
    bottom: "20@vs",
    alignItems: "center",
  },
  overviewWrap: {
    width: "100%",
    paddingHorizontal: "20@s",
  },
  overview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sats: {
    fontSize: "12@vs",
    textAlign: "center",
    marginLeft: "-4@s",
    marginTop: "-5@vs",
  },
  feeHint: {
    fontSize: "10@vs",
    marginTop: "10@vs",
  },
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  memoInput: {
    paddingHorizontal: "18@s",
    paddingVertical: "18@vs",
    borderRadius: 50,
    fontSize: "14@vs",
  },
});
