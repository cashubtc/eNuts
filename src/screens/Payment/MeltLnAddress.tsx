import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { ScaledSheet, vs } from "react-native-size-matters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AmountInput, { useShakeAnimation } from "@comps/AmountInput";
import Button from "@comps/Button";
import Card from "@comps/Card";
import useLoading from "@comps/hooks/Loading";
import { ChevronRightIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import MintSelector from "@comps/MintSelector";
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { useManager } from "@src/context/Manager";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { TMeltLnAddressPageProps } from "@src/model/nav";
import { mainColors } from "@styles";
import { vib } from "@util";
import { getInvoiceFromLnAddress } from "@src/util/lud16";

export default function MeltLnAddressScreen({
  navigation,
  route,
}: TMeltLnAddressPageProps) {
  const {
    lnAddress,
    selectedMint: preselection,
    metadata,
  } = route.params || {};
  const { knownMints } = useKnownMints();
  const manager = useManager();
  const { color } = useThemeContext();
  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { loading, startLoading, stopLoading } = useLoading();
  const { shake } = useShakeAnimation();
  const insets = useSafeAreaInsets();

  const amountInputRef = useRef<TextInput>(null);
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);

  const [selectedMint, setSelectedMint] = useState<KnownMintWithBalance | null>(
    knownMints.find((m) => m.mintUrl === preselection) || null
  );
  const [amountInput, setAmountInput] = useState("");
  const [err, setErr] = useState(false);

  const amountValue = useMemo(() => {
    const parsed = parseInt(amountInput || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amountInput]);

  const noMintsAvailable = useMemo(() => {
    return !selectedMint || knownMints.length === 0;
  }, [selectedMint, knownMints.length]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleMintSelectionOpen = useCallback(() => {
    amountInputRef.current?.blur();

    if (mintSelectionSheetRef.current) {
      try {
        mintSelectionSheetRef.current.present();
      } catch (error) {
        /* ignore */
      }
    }
  }, []);

  const handleMintSelect = useCallback((mint: KnownMintWithBalance) => {
    setSelectedMint(mint);
  }, []);

  const handleSubmit = useCallback(async () => {
    startLoading();
    if (!selectedMint) return;

    const amountInMsats = amountValue * 1000;
    const isAmountTooLow = amountValue < 1;
    const isBelowMin =
      metadata.minSendable && metadata.minSendable > amountInMsats;
    const isAboveMax =
      metadata.maxSendable && metadata.maxSendable < amountInMsats;

    if (isAmountTooLow || isBelowMin || isAboveMax) {
      vib(400);
      setErr(true);
      shake();
      const timeout = setTimeout(() => {
        setErr(false);
        clearTimeout(timeout);
      }, 500);
      return;
    }

    try {
      const invoice = await getInvoiceFromLnAddress(metadata, amountInMsats);
      const quote = await manager.quotes.createMeltQuote(
        selectedMint.mintUrl,
        invoice
      );

      navigation.navigate("MeltConfirmation", {
        quote,
        mintUrl: selectedMint.mintUrl,
      });
    } catch (error) {
      openPromptAutoClose({
        msg: t("invalidInvoice", { ns: NS.common }),
      });
    } finally {
      stopLoading();
    }
  }, [
    amountValue,
    selectedMint,
    metadata,
    navigation,
    shake,
    manager,
    openPromptAutoClose,
    t,
  ]);

  if (noMintsAvailable) {
    return (
      <Screen
        screenName={t("cashOut")}
        withBackBtn
        handlePress={handleBack}
        mintBalance={0}
        disableMintBalance
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
      withPadding={false}
      withBottomInset={false}
      withKeyboard={true}
    >
      <AmountInput
        ref={amountInputRef}
        value={amountInput}
        onChange={setAmountInput}
        onSubmit={handleSubmit}
        error={err}
        autoFocus
        testID="melt-amount-input"
      />

      <View style={styles.actionWrap}>
        <View style={{ width: "100%", gap: vs(10), paddingBottom: vs(10) }}>
          <View style={styles.cardContainer}>
            <Card>
              <View style={styles.addressSection}>
                <Txt txt={lnAddress || ""} styles={[styles.addressText]} bold />
              </View>

              {metadata && (metadata.minSendable || metadata.maxSendable) && (
                <View style={styles.amountRangeSection}>
                  {metadata.minSendable && (
                    <View style={styles.rangeItem}>
                      <Txt
                        txt="Min"
                        styles={[
                          styles.rangeLabel,
                          { color: color.TEXT_SECONDARY },
                        ]}
                      />
                      <Txt
                        txt={`${Math.floor(metadata.minSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  )}
                  {metadata.maxSendable && (
                    <View style={styles.rangeItem}>
                      <Txt
                        txt="Max"
                        styles={[
                          styles.rangeLabel,
                          { color: color.TEXT_SECONDARY },
                        ]}
                      />
                      <Txt
                        txt={`${Math.floor(metadata.maxSendable / 1000)} sats`}
                        styles={[styles.rangeValue]}
                      />
                    </View>
                  )}
                </View>
              )}
            </Card>
          </View>
          <MintSelector
            mint={selectedMint!}
            onPress={handleMintSelectionOpen}
          />
          <Button
            disabled={loading || !amountValue}
            txt={t("continue")}
            onPress={handleSubmit}
            icon={
              loading ? (
                <Loading size={20} />
              ) : (
                <ChevronRightIcon color={mainColors.WHITE} />
              )
            }
          />
        </View>
      </View>

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
  actionWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: "20@s",
  },
  cardContainer: {
    width: "100%",
  },
  addressSection: {
    width: "100%",
  },
  label: {
    fontSize: "11@ms",
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: "14@ms",
  },
  amountRangeSection: {
    flexDirection: "row",
    gap: "25@s",
    marginTop: "10@vs",
    paddingTop: "10@vs",
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
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
});
