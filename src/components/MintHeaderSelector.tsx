import { MintBoardIcon } from "@comps/Icons";
import MintSelectionSheet from "@comps/MintSelectionSheet";
import Txt from "@comps/Txt";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCurrencyContext } from "@src/context/Currency";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";
import { Image } from "expo-image";
import { useMemo, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

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
  const { color, highlight } = useThemeContext();
  const { formatAmount } = useCurrencyContext();
  const { hidden } = usePrivacyContext();
  const mintSelectionSheetRef = useRef<BottomSheetModal>(null);

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
            backgroundColor: color.INPUT_BG,
            borderColor: color.BORDER,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: color.INPUT_BG,
              borderColor: color.BORDER,
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
            <MintBoardIcon width={18} height={18} color={hi[highlight]} />
          )}
        </View>
        <Txt txt={headerBalance} bold styles={[styles.balance, { color: color.TEXT }]} />
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

const styles = ScaledSheet.create({
  button: {
    minWidth: "40@s",
    height: "40@s",
    borderRadius: "20@s",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "8@s",
    paddingLeft: "3@s",
    paddingRight: "12@s",
    marginRight: "12@s",
  },
  iconWrap: {
    width: "32@s",
    height: "32@s",
    borderRadius: "16@s",
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
    fontSize: "12@ms",
    maxWidth: "92@s",
  },
});
