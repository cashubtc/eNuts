import Button, { IconBtn, TxtButton } from "@comps/Button";
import Empty from "@comps/Empty";
import { PlusIcon } from "@comps/Icons";
import { _testmintUrl } from "@consts";
import type { TMintsPageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { BITCOIN_MINTS_URL } from "@src/consts/urls";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { useQRScanHandler } from "@util/qrScanner";
import { globals } from "@styles";
import { getColor } from "@styles/colors";
import { isErr, openUrl } from "@util";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet } from "react-native-size-matters";
import BottomSheet from "@gorhom/bottom-sheet";
import AddMintBottomSheet from "./components/AddMintBottomSheet";
import MintItem from "./components/MintItem";

export default function Mints({ navigation }: TMintsPageProps) {
    const { t } = useTranslation([NS.common]);
    const { closePrompt, openPromptAutoClose } = usePromptContext();
    const { color, highlight } = useThemeContext();
    const insets = useSafeAreaInsets();
    const { hidden } = usePrivacyContext();
    const { knownMints } = useKnownMints();
    const { openQRScanner } = useQRScanHandler(navigation);

    // Bottom sheet ref
    const addMintSheetRef = useRef<BottomSheet>(null);

    // Handle QR scanner opening
    const handleOpenQRScanner = useCallback(() => {
        void openQRScanner();
    }, [openQRScanner]);

    return (
        <View style={[globals(color).container, styles.container]}>
            <TopNav
                screenName="Mints"
                withBackBtn
                handlePress={() => navigation.goBack()}
            />

            {knownMints.length > 0 ? (
                <View
                    style={[
                        styles.topSection,
                        { marginBottom: 75 + insets.bottom },
                    ]}
                >
                    <ScrollView
                        style={[globals(color).wrapContainer]}
                        alwaysBounceVertical={false}
                    >
                        {knownMints.map((mint, i) => (
                            <MintItem
                                key={mint.mintUrl}
                                mint={mint}
                                navigation={navigation}
                                isLast={i === knownMints.length - 1}
                                color={color}
                                highlight={highlight}
                                hidden={hidden}
                                t={t}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.noMintContainer}>
                    <Empty txt={t("noMint")} />
                    <View style={styles.noMintBottomSection}>
                        <Button
                            txt={t("addNewMint", { ns: NS.mints })}
                            onPress={() =>
                                addMintSheetRef.current?.snapToIndex(0)
                            }
                        />
                    </View>
                </View>
            )}

            {knownMints.length > 0 && (
                <View style={[styles.newMint, { marginBottom: insets.bottom }]}>
                    <IconBtn
                        icon={
                            <PlusIcon
                                width={s(30)}
                                height={s(30)}
                                color={getColor(highlight, color)}
                            />
                        }
                        onPress={() => {
                            closePrompt();
                            addMintSheetRef.current?.snapToIndex(0);
                        }}
                    />
                </View>
            )}

            <AddMintBottomSheet
                ref={addMintSheetRef}
                onMintAdded={() => {}}
                onOpenQRScanner={handleOpenQRScanner}
            />
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 8,
    },
    noMintContainer: {
        flex: 1,
        width: "100%",
        paddingHorizontal: "20@s",
    },
    noMintBottomSection: {
        position: "absolute",
        bottom: "20@s",
        right: "20@s",
        left: "20@s",
        rowGap: "20@s",
    },
    topSection: {
        width: "100%",
    },
    newMint: {
        position: "absolute",
        right: 20,
        bottom: 20,
    },
});
