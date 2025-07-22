import BottomSheet, {
    BottomSheetScrollView,
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { formatSatStr } from "@util";
import { mainColors } from "@styles";
import React, { forwardRef, useMemo, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Dimensions } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MintSelectionSheetProps {
    selectedMint?: { mintUrl: string };
    onMintSelect: (mint: KnownMintWithBalance) => void;
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
    }: {
        mint: KnownMintWithBalance;
        isSelected: boolean;
        onPress: (mint: KnownMintWithBalance) => void;
        textColor: string;
        secondaryTextColor: string;
        inputBgColor: string;
    }) => {
        const handlePress = useCallback(() => onPress(mint), [onPress, mint]);

        return (
            <TouchableOpacity
                style={[
                    styles.mintItem,
                    {
                        backgroundColor: inputBgColor,
                        borderColor: isSelected
                            ? mainColors.VALID
                            : "transparent",
                    },
                ]}
                onPress={handlePress}
            >
                <View style={styles.mintInfo}>
                    <Txt
                        txt={mint.name || new URL(mint.mintUrl).hostname}
                        styles={[styles.mintAlias, { color: textColor }]}
                    />
                    <Txt
                        txt={mint.mintUrl}
                        styles={[styles.mintUrl, { color: secondaryTextColor }]}
                    />
                </View>
                <Txt
                    txt={formatSatStr(mint.balance)}
                    styles={[styles.balance, { color: mainColors.VALID }]}
                />
            </TouchableOpacity>
        );
    }
);

MintItem.displayName = "MintItem";

const MintSelectionSheet = forwardRef<BottomSheet, MintSelectionSheetProps>(
    ({ selectedMint, onMintSelect }, ref) => {
        const { t } = useTranslation([NS.common]);
        const { color } = useThemeContext();
        const { knownMints } = useKnownMints();
        const insets = useSafeAreaInsets();

        // Filter mints with balances > 0
        const mintsWithBalance = useMemo(
            () => knownMints.filter((mint) => mint.balance > 0),
            [knownMints]
        );

        // Use dynamic sizing for optimal height calculation
        const maxHeight = useMemo(() => {
            // Cap height at 80% of screen height to prevent overly tall sheets
            const screenHeight = Dimensions.get("window").height;
            return Math.floor(screenHeight * 0.8);
        }, []);

        const handleMintPress = useCallback(
            (mint: KnownMintWithBalance) => {
                onMintSelect(mint);
                (ref as React.RefObject<BottomSheet>)?.current?.close();
            },
            [onMintSelect, ref]
        );

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    opacity={0.5}
                />
            ),
            []
        );

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                enablePanDownToClose={true}
                enableDynamicSizing
                maxDynamicContentSize={maxHeight}
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: color.BACKGROUND,
                }}
                handleIndicatorStyle={{
                    backgroundColor: color.TEXT_SECONDARY,
                }}
                animateOnMount={true}
            >
                <BottomSheetScrollView
                    style={[
                        styles.scrollView,
                        { backgroundColor: color.BACKGROUND },
                    ]}
                    contentContainerStyle={[styles.scrollContent]}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.header,
                            {
                                backgroundColor: color.BACKGROUND,
                                borderBottomColor:
                                    color.BORDER || "rgba(0,0,0,0.1)",
                            },
                        ]}
                    >
                        <Txt
                            txt={t("selectMint", { ns: NS.common })}
                            styles={[styles.headerText, { color: color.TEXT }]}
                        />
                    </View>

                    {mintsWithBalance.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Txt
                                txt={t("noMintsWithBalance", {
                                    ns: NS.common,
                                })}
                                styles={[{ color: color.TEXT_SECONDARY }]}
                            />
                        </View>
                    ) : (
                        mintsWithBalance.map((mint) => (
                            <MintItem
                                key={mint.mintUrl}
                                mint={mint}
                                isSelected={
                                    selectedMint?.mintUrl === mint.mintUrl
                                }
                                onPress={handleMintPress}
                                textColor={color.TEXT}
                                secondaryTextColor={color.TEXT_SECONDARY}
                                inputBgColor={color.INPUT_BG}
                            />
                        ))
                    )}
                </BottomSheetScrollView>
            </BottomSheet>
        );
    }
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
    },
});

export default MintSelectionSheet;
