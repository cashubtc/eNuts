import { useShakeAnimation } from "@comps/animation/Shake";
import Button from "@comps/Button";
import { ChevronRightIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatSatStr, vib } from "@util";
import { useCallback, useRef, useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import BottomSheet from "@gorhom/bottom-sheet";
import { useManager } from "@src/context/Manager";
import { MintSelectAmountProps } from "@src/nav/navTypes";

export default function MintSelectAmountScreen({
  navigation,
}: MintSelectAmountProps) {
  const { t } = useTranslation([NS.wallet]);
  const { color, highlight } = useThemeContext();
  const { anim, shake } = useShakeAnimation();
  const { knownMints } = useKnownMints();
  const manager = useManager();
  // Use useRef instead of createRef to avoid recreation on every render
  const numericInputRef = useRef<TextInput>(null);
  const txtInputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheet>(null);

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

  // Memoize expensive URL hostname extraction
  const selectedMintName = useMemo(() => {
    if (!selectedMint) return "";
    try {
      return selectedMint.name || new URL(selectedMint.mintUrl).hostname;
    } catch {
      return selectedMint.mintUrl;
    }
  }, [selectedMint]);

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
    // Blur the text inputs when opening the sheet
    numericInputRef.current?.blur();
    txtInputRef.current?.blur();

    // Try expand method first, fallback to snapToIndex
    if (mintSelectionSheetRef.current) {
      try {
        mintSelectionSheetRef.current.expand();
      } catch (error) {
        mintSelectionSheetRef.current.snapToIndex(0);
      }
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    // Close the mint selection sheet when input is focused
    mintSelectionSheetRef.current?.close();
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    const sanitized = text.replace(/\D/g, "");
    setAmountInput(sanitized);
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
      <Txt
        txt={t("invoiceAmountHint", {
          ns: NS.mints,
        })}
        styles={[styles.headerHint]}
      />

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
            onSubmitEditing={handleSubmit}
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

      {/* Mint Selection Button - More seamless design */}
      <TouchableOpacity
        style={[styles.seamlessMintSelector, { borderColor: color.BORDER }]}
        onPress={handleMintSelectionOpen}
      >
        <View style={styles.mintSelectorInfo}>
          <Txt
            txt={`Pay from: ${selectedMintName}`}
            styles={[styles.seamlessMintName, { color: color.TEXT_SECONDARY }]}
          />
          <Txt
            txt={`${formatSatStr(selectedMintBalance)} available`}
            styles={[styles.seamlessMintBalance, { color: color.TEXT }]}
          />
        </View>
        <ChevronRightIcon color={color.TEXT_SECONDARY} width={16} height={16} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : undefined}
        style={styles.actionWrap}
      >
        <Button
          txt={t("continue", { ns: NS.common })}
          onPress={handleSubmit}
          icon={<ChevronRightIcon color={mainColors.WHITE} />}
        />
        {isIOS && <View style={{ height: vs(100) }} />}
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
    position: "absolute",
    bottom: "20@vs",
    left: "20@s",
    right: "20@s",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  memoInput: {
    flex: 1,
    marginRight: "20@s",
    paddingHorizontal: "18@s",
    paddingVertical: "18@vs",
    borderRadius: 50,
    fontSize: "14@vs",
  },

  mintSelectorInfo: {
    flex: 1,
  },
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
  seamlessMintName: {
    fontSize: "12@s",
    marginBottom: "2@vs",
  },
  seamlessMintBalance: {
    fontSize: "14@s",
    fontWeight: "500",
  },
});
