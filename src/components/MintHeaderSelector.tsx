import { MintBoardIcon } from "@comps/Icons";
import MintSelectionSheet from "@comps/MintSelectionSheet";
import Txt from "@comps/Txt";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useCurrencyContext } from "@src/context/Currency";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { useAppThemeTokens } from "@styles";
import { Image } from "expo-image";
import { useMemo, useRef } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";

interface IMintHeaderSelectorProps {
  selectedMint: KnownMintWithBalance;
  onMintSelect: (mint: KnownMintWithBalance) => void;
  onOpen?: () => void;
  multiSelect?: boolean;
  showZeroBalanceMints?: boolean;
}

export default function MintHeaderSelector({
  selectedMint,
  onMintSelect,
  onOpen,
  multiSelect = false,
  showZeroBalanceMints = false,
}: IMintHeaderSelectorProps) {
  const { formatAmount } = useCurrencyContext();
  const { hidden } = usePrivacyContext();
  const theme = useAppThemeTokens();
  const mintSelectionSheetRef = useRef<TrueSheet>(null);

  const headerBalance = useMemo(() => {
    if (hidden.balance) {
      return "****";
    }

    const { formatted, symbol } = formatAmount(selectedMint.balance);
    return `${formatted} ${symbol}`;
  }, [formatAmount, hidden.balance, selectedMint.balance]);

  const handleOpen = () => {
    onOpen?.();
    try {
      mintSelectionSheetRef.current?.present();
    } catch (error) {
      /* ignore */
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
        >
          {selectedMint.mintInfo.icon_url ? (
            <Image
              source={{ uri: selectedMint.mintInfo.icon_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <MintBoardIcon width={18} height={18} color={theme.accent} />
          )}
        </View>
        <Txt txt={headerBalance} bold styles={[styles.balance, { color: theme.text }]} />
      </TouchableOpacity>

      <MintSelectionSheet
        ref={mintSelectionSheetRef}
        selectedMint={selectedMint}
        onMintSelect={onMintSelect}
        multiSelect={multiSelect}
        showZeroBalanceMints={showZeroBalanceMints}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingLeft: 3,
    paddingRight: 12,
    marginRight: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  balance: {
    fontSize: 12,
    maxWidth: 92,
  },
});
