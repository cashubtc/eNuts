import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Txt from "@comps/Txt";
import Button from "@comps/Button";
import { CheckmarkIcon } from "@comps/Icons";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import React, { forwardRef, useMemo, useCallback, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Dimensions } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MintSelectionSheetProps {
  selectedMint?: { mintUrl: string };
  selectedMints?: { mintUrl: string }[];
  onMintSelect: (mint: KnownMintWithBalance) => void;
  onMultipleMintSelect?: (mints: KnownMintWithBalance[]) => void;
  multiSelect?: boolean;
  showZeroBalanceMints?: boolean;
}

// Memoize individual mint items to prevent re-renders
const MintItem = memo(
  ({
    mint,
    isSelected,
    onPress,
    textColor,
    secondaryTextColor,
    inputBgColor,
    multiSelect,
    formattedBalance,
  }: {
    mint: KnownMintWithBalance;
    isSelected: boolean;
    onPress: (mint: KnownMintWithBalance) => void;
    textColor: string;
    secondaryTextColor: string;
    inputBgColor: string;
    multiSelect?: boolean;
    formattedBalance: string;
  }) => {
    const handlePress = useCallback(() => onPress(mint), [onPress, mint]);

    return (
      <TouchableOpacity
        style={[
          styles.mintItem,
          {
            backgroundColor: inputBgColor,
            borderColor: isSelected ? mainColors.VALID : "transparent",
          },
        ]}
        onPress={handlePress}
      >
        <View style={styles.mintInfo}>
          <Txt
            txt={mint.name || new URL(mint.mintUrl).hostname}
            styles={[styles.mintAlias, { color: textColor }]}
          />
          <Txt txt={mint.mintUrl} styles={[styles.mintUrl, { color: secondaryTextColor }]} />
        </View>
        <View style={styles.rightSection}>
          <Txt txt={formattedBalance} styles={[styles.balance, { color: mainColors.VALID }]} />
          {multiSelect && (
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? mainColors.VALID : "transparent",
                  borderColor: isSelected ? mainColors.VALID : textColor,
                },
              ]}
            >
              {isSelected && <CheckmarkIcon color={mainColors.WHITE} width={14} height={14} />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

MintItem.displayName = "MintItem";

const MintSelectionSheet = forwardRef<BottomSheetModal, MintSelectionSheetProps>(
  (
    {
      selectedMint,
      selectedMints,
      onMintSelect,
      onMultipleMintSelect,
      multiSelect = false,
      showZeroBalanceMints = false,
    },
    ref,
  ) => {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();
    const { formatAmount } = useCurrencyContext();
    const { knownMints } = useKnownMints();
    const insets = useSafeAreaInsets();

    // Internal state for multi-select mode
    const [internalSelectedMints, setInternalSelectedMints] = useState<KnownMintWithBalance[]>([]);

    // Determine which mints to display based on balance visibility setting
    const displayMints = useMemo(
      () => (showZeroBalanceMints ? knownMints : knownMints.filter((mint) => mint.balance > 0)),
      [knownMints, showZeroBalanceMints],
    );

    // Initialize internal state when controlled selectedMints change
    React.useEffect(() => {
      if (multiSelect && selectedMints) {
        const controlledSelectedMints = displayMints.filter((mint) =>
          selectedMints.some((selected) => selected.mintUrl === mint.mintUrl),
        );
        setInternalSelectedMints(controlledSelectedMints);
      }
    }, [selectedMints, displayMints, multiSelect]);

    // Determine selected mints based on mode
    const currentSelectedMints = useMemo(() => {
      if (multiSelect) {
        return internalSelectedMints;
      }
      return selectedMint
        ? [displayMints.find((m) => m.mintUrl === selectedMint.mintUrl)].filter(Boolean)
        : [];
    }, [multiSelect, internalSelectedMints, selectedMint, displayMints]);

    // Use dynamic sizing for optimal height calculation
    const maxHeight = useMemo(() => {
      // Cap height at 80% of screen height to prevent overly tall sheets
      const screenHeight = Dimensions.get("window").height;
      return Math.floor(screenHeight * 0.8);
    }, []);

    const handleMintPress = useCallback(
      (mint: KnownMintWithBalance) => {
        if (multiSelect) {
          setInternalSelectedMints((prev) => {
            const isAlreadySelected = prev.some((selected) => selected.mintUrl === mint.mintUrl);
            if (isAlreadySelected) {
              return prev.filter((selected) => selected.mintUrl !== mint.mintUrl);
            } else {
              return [...prev, mint];
            }
          });
        } else {
          // Single select mode - close immediately
          onMintSelect(mint);
          (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        }
      },
      [multiSelect, onMintSelect, ref],
    );

    const handleConfirmMultiSelect = useCallback(() => {
      if (onMultipleMintSelect) {
        onMultipleMintSelect(internalSelectedMints);
      }
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [onMultipleMintSelect, internalSelectedMints, ref]);

    const isMintSelected = useCallback(
      (mint: KnownMintWithBalance) => {
        if (multiSelect) {
          return internalSelectedMints.some((selected) => selected.mintUrl === mint.mintUrl);
        }
        return selectedMint?.mintUrl === mint.mintUrl;
      },
      [multiSelect, internalSelectedMints, selectedMint],
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enablePanDownToClose={true}
        enableDismissOnClose
        enableDynamicSizing
        maxDynamicContentSize={maxHeight}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: color.BACKGROUND,
        }}
        handleIndicatorStyle={{
          backgroundColor: color.TEXT_SECONDARY,
        }}
      >
        <BottomSheetScrollView
          style={[styles.scrollView, { backgroundColor: color.BACKGROUND }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: color.BACKGROUND,
                borderBottomColor: color.BORDER || "rgba(0,0,0,0.1)",
              },
            ]}
          >
            <Txt
              txt={t(multiSelect ? "selectMints" : "selectMint", {
                ns: NS.common,
              })}
              styles={[styles.headerText, { color: color.TEXT }]}
            />
          </View>

          {displayMints.length === 0 ? (
            <View style={styles.emptyState}>
              <Txt
                txt={t("noMintsWithBalance", {
                  ns: NS.common,
                })}
                styles={[{ color: color.TEXT_SECONDARY }]}
              />
            </View>
          ) : (
            <>
              {displayMints.map((mint) => {
                const { formatted, symbol } = formatAmount(mint.balance);
                const formattedBalance = `${formatted} ${symbol}`;

                return (
                  <MintItem
                    key={mint.mintUrl}
                    mint={mint}
                    isSelected={isMintSelected(mint)}
                    onPress={handleMintPress}
                    textColor={color.TEXT}
                    secondaryTextColor={color.TEXT_SECONDARY}
                    inputBgColor={color.INPUT_BG}
                    multiSelect={multiSelect}
                    formattedBalance={formattedBalance}
                  />
                );
              })}

              {multiSelect && (
                <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + vs(16) }]}>
                  <Button
                    txt={t("confirm", { ns: NS.common })}
                    onPress={handleConfirmMultiSelect}
                    disabled={internalSelectedMints.length === 0}
                  />
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = ScaledSheet.create({
  header: {
    paddingVertical: "10@vs",
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: "16@vs",
  },
  headerText: {
    fontSize: "18@s",
    fontWeight: "600",
  },
  selectedCount: {
    fontSize: "12@s",
    marginTop: "4@vs",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: "16@s",
  },
  emptyState: {
    padding: "20@s",
    alignItems: "center",
  },
  mintItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: "16@s",
    marginBottom: "12@vs",
    borderRadius: "12@s",
    borderWidth: 2,
    minHeight: "70@vs",
  },
  mintInfo: {
    flex: 1,
    marginRight: "12@s",
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  mintAlias: {
    fontSize: "16@s",
    fontWeight: "500",
    marginBottom: "4@vs",
  },
  mintUrl: {
    fontSize: "12@s",
  },
  balance: {
    fontSize: "14@s",
    fontWeight: "600",
    marginBottom: "8@vs",
  },
  checkbox: {
    width: "22@s",
    height: "22@s",
    borderRadius: "4@s",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    paddingHorizontal: "16@s",
    paddingTop: "20@vs",
  },
});

export default MintSelectionSheet;
