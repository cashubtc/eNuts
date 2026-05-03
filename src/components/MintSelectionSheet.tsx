import Txt from "@comps/Txt";
import Button from "@comps/Button";
import { CheckmarkIcon } from "@comps/Icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useCurrencyContext } from "@src/context/Currency";
import { useKnownMints, type KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { useAppThemeTokens } from "@styles";
import React, {
  forwardRef,
  useMemo,
  useCallback,
  memo,
  useState,
  useRef,
  type MutableRefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, ScrollView, StyleSheet } from "react-native";
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
    validColor,
    whiteColor,
    multiSelect,
    formattedBalance,
  }: {
    mint: KnownMintWithBalance;
    isSelected: boolean;
    onPress: (mint: KnownMintWithBalance) => void;
    textColor: string;
    secondaryTextColor: string;
    inputBgColor: string;
    validColor: string;
    whiteColor: string;
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
            borderColor: isSelected ? validColor : "transparent",
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
          <Txt txt={formattedBalance} styles={[styles.balance, { color: validColor }]} />
          {multiSelect && (
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? validColor : "transparent",
                  borderColor: isSelected ? validColor : textColor,
                },
              ]}
            >
              {isSelected && <CheckmarkIcon color={whiteColor} width={14} height={14} />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

MintItem.displayName = "MintItem";

const MintSelectionSheet = forwardRef<TrueSheet, MintSelectionSheetProps>(
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
    const theme = useAppThemeTokens();
    const { formatAmount } = useCurrencyContext();
    const { knownMints } = useKnownMints();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<TrueSheet>(null);

    // Internal state for multi-select mode
    const [internalSelectedMints, setInternalSelectedMints] = useState<KnownMintWithBalance[]>([]);

    const setSheetRef = useCallback(
      (sheet: TrueSheet | null) => {
        sheetRef.current = sheet;

        if (typeof ref === "function") {
          ref(sheet);
          return;
        }

        if (ref) {
          (ref as MutableRefObject<TrueSheet | null>).current = sheet;
        }
      },
      [ref],
    );

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
          void sheetRef.current?.dismiss();
        }
      },
      [multiSelect, onMintSelect],
    );

    const handleConfirmMultiSelect = useCallback(() => {
      if (onMultipleMintSelect) {
        onMultipleMintSelect(internalSelectedMints);
      }
      void sheetRef.current?.dismiss();
    }, [onMultipleMintSelect, internalSelectedMints]);

    const isMintSelected = useCallback(
      (mint: KnownMintWithBalance) => {
        if (multiSelect) {
          return internalSelectedMints.some((selected) => selected.mintUrl === mint.mintUrl);
        }
        return selectedMint?.mintUrl === mint.mintUrl;
      },
      [multiSelect, internalSelectedMints, selectedMint],
    );

    return (
      <TrueSheet
        ref={setSheetRef}
        detents={[0.5, 1]}
        backgroundColor={theme.background}
        cornerRadius={26}
        grabberOptions={{ color: theme.textSecondary }}
        scrollable
        scrollableOptions={{
          topScrollEdgeEffect: "hidden",
          bottomScrollEdgeEffect: "hidden",
        }}
      >
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.background,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <Txt
              txt={
                multiSelect
                  ? t("selectMints", { ns: NS.common })
                  : t("selectMint", { ns: NS.common })
              }
              styles={[styles.headerText, { color: theme.text }]}
            />
          </View>

          {displayMints.length === 0 ? (
            <View style={styles.emptyState}>
              <Txt
                txt={t("noMintsWithBalance", {
                  ns: NS.common,
                })}
                styles={[{ color: theme.textSecondary }]}
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
                    textColor={theme.text}
                    secondaryTextColor={theme.textSecondary}
                    inputBgColor={theme.inputBackground}
                    validColor={theme.valid}
                    whiteColor={theme.white}
                    multiSelect={multiSelect}
                    formattedBalance={formattedBalance}
                  />
                );
              })}

              {multiSelect && (
                <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
                  <Button
                    txt={t("confirm", { ns: NS.common })}
                    onPress={handleConfirmMultiSelect}
                    disabled={internalSelectedMints.length === 0}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </TrueSheet>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  selectedCount: {
    fontSize: 12,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  mintItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 70,
  },
  mintInfo: {
    flex: 1,
    marginRight: 12,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  mintAlias: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  mintUrl: {
    fontSize: 12,
  },
  balance: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});

export default MintSelectionSheet;
