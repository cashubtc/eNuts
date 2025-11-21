import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import {
  ChevronRightIcon,
  ConnectionErrorIcon,
  CopyIcon,
  ScanQRIcon,
} from "@comps/Icons";
// Lazy load the MintSelectionSheet to improve initial render
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi, mainColors } from "@styles";
import { getStrFromClipboard } from "@util";
import {
  isLightningAddress,
  isLnurlOrAddress,
  parseLightningAddress,
} from "@util/lnurl";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
  Suspense,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { useManager } from "@src/context/Manager";
import { MeltInputProps } from "@src/nav/navTypes";
import Screen from "@comps/Screen";
import MintSelector from "@comps/MintSelector";
import { requestLnAddressMetadata } from "@src/util/lud16";

export default function MeltInputScreen({ navigation, route }: MeltInputProps) {
  const { invoice } = route.params || {};
  const { knownMints } = useKnownMints();
  const manager = useManager();

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    knownMints.length > 0 ? knownMints[0] : null
  );

  // Use refs for better performance
  const inputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);

  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { highlight } = useThemeContext();
  const { loading } = useLoading();
  const [input, setInput] = useState(invoice || "");

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
    [setSelectedMint]
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

  const handleBtnPress = async () => {
    const currentMint = selectedMint;
    if (loading || !currentMint) {
      return;
    }
    if (isLightningAddress(input)) {
      inputRef.current?.blur();
      await new Promise((resolve) => setTimeout(resolve, 400));
      const metadata = await requestLnAddressMetadata(input);
      return navigation.navigate("MeltLnAddress", {
        lnAddress: input,
        metadata,
        selectedMint: currentMint.mintUrl,
      });
    }
    // user pasted an encoded LNURL, we need to get the amount by the user
    if (isLnurlOrAddress(input)) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    }
    try {
      const quote = await manager.quotes.createMeltQuote(
        currentMint.mintUrl,
        input
      );
      return navigation.navigate("MeltConfirmation", {
        quote,
        mintUrl: currentMint.mintUrl,
      });
    } catch (e) {
      return openPromptAutoClose({ msg: t("invalidInvoice") });
    }
  };

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
        handlePress={() => navigation.goBack()}
        mintBalance={0}
        disableMintBalance
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
      screenName={t("cashOut")}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={{ flex: 1 }}>
        <TxtInput
          innerRef={inputRef}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t("invoiceOrLnAddress")}
          value={input}
          onChangeText={(text) => {
            setInput(text);
          }}
          onSubmitEditing={() => void handleBtnPress()}
          autoFocus
          ms={200}
        />

        {/* Action Buttons: Paste and Scan QR */}
        <View style={styles.inputActions}>
          <View style={{ flex: 1 }}>
            <Button
              txt={t("paste")}
              onPress={() => void handlePaste()}
              outlined
              size="small"
              icon={<CopyIcon color={hi[highlight]} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              txt={t("scanQR", { ns: NS.common })}
              onPress={handleScanQR}
              outlined
              size="small"
              icon={<ScanQRIcon color={hi[highlight]} />}
            />
          </View>
        </View>
      </View>

      {/* Mint Selection and Continue Button */}
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
            disabled={loading || !input.length}
            txt={t("continue")}
            onPress={() => void handleBtnPress()}
            icon={
              loading ? (
                <Loading size={20} />
              ) : (
                <ChevronRightIcon color={mainColors.WHITE} />
              )
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* Mint Selection Sheet */}
      <Suspense fallback={<View />}>
        <MintSelectionSheet
          ref={mintSelectionSheetRef}
          selectedMint={selectedMint!}
          onMintSelect={handleMintSelect}
          multiSelect={false}
        />
      </Suspense>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  inputActions: {
    flexDirection: "row",
    gap: "8@vs",
    marginTop: "8@vs",
  },
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
});
