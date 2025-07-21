import BottomSheet, {
    BottomSheetScrollView,
    BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { formatSatStr } from "@util";
import { mainColors } from "@styles";
import React, { forwardRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MintSelectionSheetProps {
    selectedMint?: { mintUrl: string };
    onMintSelect: (mint: KnownMintWithBalance) => void;
}

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

        const snapPoints = useMemo(() => {
            // Use percentage for more reliable behavior
            const minHeight = Math.max(350, 200 + mintsWithBalance.length * 80);
            // Add safe area insets to the total height since we're incorporating it into the content
            const maxHeight = Math.min(minHeight + insets.bottom + vs(20), 650);

            // Convert to percentage if needed
            const heightPercent = Math.min(
                Math.max((maxHeight / 800) * 100, 40),
                80
            );

            console.log(
                "MintSelectionSheet snapPoints:",
                [`${heightPercent}%`],
                "mintsCount:",
                mintsWithBalance.length,
                "calculated height:",
                maxHeight,
                "insets.bottom:",
                insets.bottom
            );

            return [`${heightPercent}%`];
        }, [mintsWithBalance.length, insets.bottom]);

        const handleMintPress = (mint: KnownMintWithBalance) => {
            console.log("Mint selected:", mint.name || mint.mintUrl);
            onMintSelect(mint);
            (ref as React.RefObject<BottomSheet>)?.current?.close();
        };

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
                snapPoints={snapPoints}
                index={-1}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: color.BACKGROUND,
                }}
                handleIndicatorStyle={{
                    backgroundColor: color.TEXT_SECONDARY,
                }}
            >
                <View
                    style={[
                        styles.container,
                        {
                            backgroundColor: color.BACKGROUND,
                            paddingBottom: insets.bottom + vs(20),
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.header,
                            {
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

                    <BottomSheetScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
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
                                <TouchableOpacity
                                    key={mint.mintUrl}
                                    style={[
                                        styles.mintItem,
                                        {
                                            backgroundColor: color.INPUT_BG,
                                            borderColor:
                                                selectedMint?.mintUrl ===
                                                mint.mintUrl
                                                    ? mainColors.VALID
                                                    : "transparent",
                                        },
                                    ]}
                                    onPress={() => handleMintPress(mint)}
                                >
                                    <View style={styles.mintInfo}>
                                        <Txt
                                            txt={
                                                mint.name ||
                                                new URL(mint.mintUrl).hostname
                                            }
                                            styles={[
                                                styles.mintAlias,
                                                { color: color.TEXT },
                                            ]}
                                        />
                                        <Txt
                                            txt={mint.mintUrl}
                                            styles={[
                                                styles.mintUrl,
                                                { color: color.TEXT_SECONDARY },
                                            ]}
                                        />
                                    </View>
                                    <Txt
                                        txt={formatSatStr(mint.balance)}
                                        styles={[
                                            styles.balance,
                                            { color: mainColors.VALID },
                                        ]}
                                    />
                                </TouchableOpacity>
                            ))
                        )}
                    </BottomSheetScrollView>
                </View>
            </BottomSheet>
        );
    }
);

const styles = ScaledSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: "20@s",
    },
    header: {
        paddingVertical: "20@vs",
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
        paddingBottom: "30@vs",
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
