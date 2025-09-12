import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon } from "@comps/Icons";
// Lazy load the MintSelectionSheet to improve initial render
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import type { TMeltInputfieldPageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { decodeLnInvoice, getStrFromClipboard, formatSatStr } from "@util";
import {
  decodeUrlOrAddress,
  getLnurlData,
  isLnurlOrAddress,
} from "@util/lnurl";
import { checkFees } from "@wallet";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { useManager } from "@src/context/Manager";
import { MeltInputProps } from "@src/nav/navTypes";
import Screen, { ScreenWithKeyboard } from "@comps/Screen";

export default function MeltInputScreen({ navigation }: MeltInputProps) {
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
  const { color, highlight } = useThemeContext();
  const { loading, startLoading, stopLoading } = useLoading();
  const [input, setInput] = useState("");
  const [decodedAmount, setDecodedAmount] = useState(0);

  // Get balance from selected mints (always multi-select mode)
  const balance = selectedMint?.balance || 0;

  // Memoize selected mint name for performance
  const selectedMintName = selectedMint?.name || selectedMint?.mintUrl;

  // Check if we have mints available
  const noMintsAvailable = !selectedMint || knownMints.length === 0;

  // Mint selection handlers - always multi-select
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

  // Paste/Clear input for LNURL/LN invoice
  const handleInputLabelPress = async () => {
    // clear input
    if (input.length > 0) {
      setInput("");
      setDecodedAmount(0);
      return;
    }
    // paste from clipboard
    const clipboard = await getStrFromClipboard();
    if (!clipboard) {
      return;
    }
    setInput(clipboard);
  };

  const handleBtnPress = async () => {
    const currentMint = selectedMint;
    if (loading || !currentMint) {
      return;
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
    <ScreenWithKeyboard
      screenName={t("cashOut")}
      withBackBtn
      handlePress={() => navigation.goBack()}
      mintBalance={balance}
      disableMintBalance
    >
      <View style={{ flex: 1 }}>
        <View style={{ position: "relative" }}>
          <TxtInput
            innerRef={inputRef}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t("invoiceOrLnurl")}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              /* Handle when the continue button is pressed
							if (isLnInvoice(text)) {
								void handleInvoicePaste(text)
							}
							*/
            }}
            onSubmitEditing={() => void handleBtnPress()}
            autoFocus
            ms={200}
            style={{ paddingRight: s(90) }}
          />
          {/* Paste / Clear Input */}
          <TouchableOpacity
            style={[
              styles.pasteInputTxtWrap,
              { backgroundColor: color.INPUT_BG },
            ]}
            onPress={() => void handleInputLabelPress()}
            testID="paste-input"
          >
            <Text style={globals(color, highlight).pressTxt}>
              {!input.length ? t("paste") : t("clear")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.seamlessMintSelector,
          {
            borderColor: color.BORDER,
            opacity: 1,
          },
        ]}
        onPress={handleMintSelectionOpen}
      >
        <View style={styles.mintSelectorInfo}>
          <Txt
            txt={`Pay from: ${selectedMintName}`}
            styles={[styles.seamlessMintName, { color: color.TEXT_SECONDARY }]}
          />
          <Txt
            txt={`${formatSatStr(balance)} available`}
            styles={[styles.seamlessMintBalance, { color: color.TEXT }]}
          />
        </View>
        <ChevronRightIcon color={color.TEXT_SECONDARY} width={16} height={16} />
      </TouchableOpacity>
      <Button
        disabled={loading || !input.length}
        txt={t("continue")}
        onPress={() => void handleBtnPress()}
        icon={loading ? <Loading size={20} /> : undefined}
      />
      {isIOS && <View style={styles.placeholder} />}
      {/* Mint Selection Sheet with Multi-Select Support */}
      <Suspense fallback={<View />}>
        <MintSelectionSheet
          ref={mintSelectionSheetRef}
          selectedMint={selectedMint!}
          onMintSelect={setSelectedMint}
          multiSelect={false}
        />
      </Suspense>
    </ScreenWithKeyboard>
  );
}

const styles = ScaledSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingBottom: isIOS ? "50@vs" : "20@vs",
    paddingTop: "90@vs",
  },
  pasteInputTxtWrap: {
    position: "absolute",
    right: "10@s",
    top: "10@vs",
    padding: "10@s",
  },
  actionWrap: {
    paddingHorizontal: "20@s",
  },
  placeholder: {
    height: "20@vs",
  },
  // Mint selector styles - Same as SelectAmount.tsx
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
  mintSelectorInfo: {
    flex: 1,
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
