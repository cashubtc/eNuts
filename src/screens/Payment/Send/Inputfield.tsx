import Button from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import Loading from "@comps/Loading";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon, CheckmarkIcon } from "@comps/Icons";
// Lazy load the MintSelectionSheet to improve initial render
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import type { TMeltInputfieldPageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, mainColors } from "@styles";
import {
    decodeLnInvoice,
    getStrFromClipboard,
    isErr,
    openUrl,
    formatSatStr,
} from "@util";
import {
    decodeUrlOrAddress,
    getLnurlData,
    isLnurlOrAddress,
} from "@util/lnurl";
import { checkFees } from "@wallet";
import {
    createRef,
    useEffect,
    useState,
    useRef,
    useMemo,
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
import { s, ScaledSheet, vs } from "react-native-size-matters";
import BottomSheet from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MeltOverview } from "../SelectAmount";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";

export default function InputfieldScreen({
    navigation,
    route,
}: TMeltInputfieldPageProps) {
    const { knownMints } = useKnownMints();

    // Mint selection state - support for multiple mints and route params
    const defaultMint = useMemo(() => {
        // If route params provide a mint, use that; otherwise use first known mint
        if (route.params?.mint) {
            const routeMint = knownMints.find(
                (m) => m.mintUrl === route.params.mint.mintUrl
            );
            return routeMint || (knownMints.length > 0 ? knownMints[0] : null);
        }
        return knownMints.length > 0 ? knownMints[0] : null;
    }, [knownMints, route.params]);

    const [selectedMint, setSelectedMint] =
        useState<KnownMintWithBalance | null>(defaultMint);
    const [selectedMints, setSelectedMints] = useState<KnownMintWithBalance[]>(
        []
    );

    // AI pathfinding state
    const [aiPathfindingEnabled, setAIPathfindingEnabled] = useState(false);

    // Use refs for better performance
    const inputRef = useRef<TextInput>(null);
    const mintSelectionSheetRef = useRef<BottomSheet>(null);

    const { t } = useTranslation([NS.common]);
    const { openPromptAutoClose } = usePromptContext();
    const { color, highlight } = useThemeContext();
    const { loading, startLoading, stopLoading } = useLoading();
    const [input, setInput] = useState("");
    const [decodedAmount, setDecodedAmount] = useState(0);
    const [estFee, setEstFee] = useState(0);

    // Get balance from selected mints (always multi-select mode)
    const balance = useMemo(() => {
        if (selectedMints.length > 0) {
            return selectedMints.reduce(
                (total, mint) => total + mint.balance,
                0
            );
        }
        // Fallback to single mint if no multi-selection yet
        return selectedMint?.balance || 0;
    }, [selectedMint, selectedMints]);

    // Memoize selected mint name for performance
    const selectedMintName = useMemo(() => {
        if (selectedMints.length > 0) {
            if (selectedMints.length === 1) {
                const mint = selectedMints[0];
                try {
                    return mint.name || new URL(mint.mintUrl).hostname;
                } catch {
                    return mint.mintUrl;
                }
            }
            return `${selectedMints.length} mints`;
        }
        // Fallback to single mint display
        if (!selectedMint) return "";
        try {
            return selectedMint.name || new URL(selectedMint.mintUrl).hostname;
        } catch {
            return selectedMint.mintUrl;
        }
    }, [selectedMint, selectedMints]);

    // Check if we have mints available
    const noMintsAvailable = useMemo(() => {
        return (
            selectedMints.length === 0 &&
            (!selectedMint || knownMints.length === 0)
        );
    }, [selectedMint, selectedMints, knownMints.length]);

    // Mint selection handlers - always multi-select
    const handleMintSelect = useCallback((mint: KnownMintWithBalance) => {
        // Legacy single select for fallback
        setSelectedMint(mint);
    }, []);

    const handleMultipleMintSelect = useCallback(
        (mints: KnownMintWithBalance[]) => {
            setSelectedMints(mints);
            // Also update single mint for compatibility
            if (mints.length > 0) {
                setSelectedMint(mints[0]);
            }
        },
        []
    );

    const handleAIPathfindingChange = useCallback((enabled: boolean) => {
        setAIPathfindingEnabled(enabled);
    }, []);

    const handleMintSelectionOpen = useCallback(() => {
        // Blur the input when opening the sheet
        inputRef.current?.blur();

        // Try expand method first, fallback to snapToIndex
        if (mintSelectionSheetRef.current) {
            try {
                mintSelectionSheetRef.current.expand();
            } catch (error) {
                mintSelectionSheetRef.current.snapToIndex(0);
            }
        }
    }, []);

    const handleInputFocus = useCallback(() => {
        // Close the mint selection sheet when input is focused
        mintSelectionSheetRef.current?.close();
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
        // pasted LNURL address which does not need decoding
        if (isLnurlOrAddress(clipboard)) {
            return;
        }
        // pasted LN invoice
        await handleInvoicePaste(clipboard);
    };

    const handleInvoicePaste = async (clipboard: string) => {
        const currentMint =
            selectedMints.length > 0 ? selectedMints[0] : selectedMint;
        if (!currentMint) return;

        try {
            startLoading();
            const { amount } = decodeLnInvoice(clipboard);
            setDecodedAmount(amount);
            const fee = await checkFees(currentMint.mintUrl, clipboard);
            setEstFee(fee);
            inputRef.current?.blur();
            stopLoading();
        } catch {
            // invalid LN invoice
            stopLoading();
            openPromptAutoClose({ msg: t("invalidInvoice") });
            setInput("");
        }
    };

    const handleBtnPress = async () => {
        const currentMint =
            selectedMints.length > 0 ? selectedMints[0] : selectedMint;
        if (loading || !currentMint) {
            return;
        }
        // open user LN wallet
        if (!input.length) {
            return openUrl("lightning://")?.catch((e) =>
                openPromptAutoClose({
                    msg: isErr(e) ? e.message : t("deepLinkErr"),
                })
            );
        }
        // user pasted an encoded LNURL, we need to get the amount by the user
        if (isLnurlOrAddress(input)) {
            const decoded = decodeUrlOrAddress(input);
            if (!decoded) {
                return openPromptAutoClose({ msg: "Could not decode LNURL!" });
            }
            try {
                const lnurlData = await getLnurlData(decoded);
                if (!lnurlData) {
                    return openPromptAutoClose({
                        msg: "Could not fetch data from LNURL",
                    });
                }
                return navigation.navigate("selectAmount", {
                    isMelt: true,
                    lnurl: { userInput: input, url: decoded, data: lnurlData },
                });
            } catch {
                return openPromptAutoClose({
                    msg: "Could not fetch data from LNURL",
                });
            }
        }
        // not enough funds
        if (decodedAmount + estFee > balance) {
            return openPromptAutoClose({ msg: t("noFunds") });
        }
        // user pasted a LN invoice before submitting
        try {
            // decode again in case the user changes the input after pasting it
            const { timeLeft } = decodeLnInvoice(input);
            // Invoice expired
            if (timeLeft <= 0) {
                setInput("");
                return openPromptAutoClose({ msg: t("expired") + "!" });
            }
            // navigate to coin selection screen
            navigation.navigate("coinSelection", {
                mint: currentMint,
                balance,
                amount: decodedAmount,
                estFee,
                isMelt: true,
                recipient: input,
                aiPathfindingEnabled,
            });
        } catch {
            // invalid invoice
            openPromptAutoClose({ msg: t("invalidInvoice") });
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

    // Initialize selectedMints with defaultMint when component mounts
    useEffect(() => {
        if (defaultMint && selectedMints.length === 0) {
            setSelectedMints([defaultMint]);
        }
    }, [defaultMint, selectedMints.length]);

    // Early return if no mints available
    if (noMintsAvailable) {
        return (
            <View style={[globals(color).container, styles.container]}>
                <TopNav
                    screenName={t("cashOut")}
                    withBackBtn
                    handlePress={() => navigation.goBack()}
                    mintBalance={0}
                    disableMintBalance
                />
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
            </View>
        );
    }

    return (
        <View style={[globals(color).container, styles.container]}>
            <TopNav
                screenName={t("cashOut")}
                withBackBtn
                handlePress={() => navigation.goBack()}
                mintBalance={balance}
                disableMintBalance
            />
            <View>
                {decodedAmount > 0 ? (
                    <>
                        {loading ? (
                            <View style={styles.loadingWrap}>
                                <Loading size={25} />
                            </View>
                        ) : (
                            <>
                                <View
                                    style={[
                                        globals(color).wrapContainer,
                                        styles.overviewWrap,
                                    ]}
                                >
                                    <MeltOverview
                                        amount={decodedAmount}
                                        balTooLow={
                                            decodedAmount + estFee > balance
                                        }
                                        fee={estFee}
                                        isInvoice
                                    />
                                </View>
                                <Txt
                                    txt={
                                        "* " +
                                        t("cashOutAmountHint", { ns: NS.mints })
                                    }
                                    styles={[
                                        styles.feeHint,
                                        { color: color.TEXT_SECONDARY },
                                    ]}
                                />
                            </>
                        )}
                    </>
                ) : null}

                {/* AI Pathfinding Option */}
                <TouchableOpacity
                    style={[
                        styles.aiPathfindingContainer,
                        {
                            backgroundColor: color.INPUT_BG,
                            borderColor: color.BORDER,
                        },
                    ]}
                    onPress={() =>
                        handleAIPathfindingChange(!aiPathfindingEnabled)
                    }
                >
                    <View style={styles.aiPathfindingContent}>
                        <Ionicons
                            name="sparkles-sharp"
                            size={18}
                            color={
                                aiPathfindingEnabled
                                    ? mainColors.VALID
                                    : color.TEXT_SECONDARY
                            }
                        />
                        <Txt
                            txt="Enable AI pathfinding"
                            styles={[
                                styles.aiPathfindingText,
                                { color: color.TEXT },
                            ]}
                        />
                    </View>
                    <View
                        style={[
                            styles.checkbox,
                            {
                                backgroundColor: aiPathfindingEnabled
                                    ? mainColors.VALID
                                    : "transparent",
                                borderColor: aiPathfindingEnabled
                                    ? mainColors.VALID
                                    : color.TEXT_SECONDARY,
                            },
                        ]}
                    >
                        {aiPathfindingEnabled && (
                            <CheckmarkIcon
                                color={mainColors.WHITE}
                                width={14}
                                height={14}
                            />
                        )}
                    </View>
                </TouchableOpacity>

                {/* Mint Selection Button */}
                <TouchableOpacity
                    style={[
                        styles.seamlessMintSelector,
                        {
                            borderColor: color.BORDER,
                            opacity: aiPathfindingEnabled ? 0.5 : 1,
                        },
                    ]}
                    onPress={
                        aiPathfindingEnabled
                            ? undefined
                            : handleMintSelectionOpen
                    }
                    disabled={aiPathfindingEnabled}
                >
                    <View style={styles.mintSelectorInfo}>
                        <Txt
                            txt={
                                aiPathfindingEnabled
                                    ? "AI will select optimal mints"
                                    : `Pay from: ${selectedMintName}`
                            }
                            styles={[
                                styles.seamlessMintName,
                                { color: color.TEXT_SECONDARY },
                            ]}
                        />
                        {!aiPathfindingEnabled && (
                            <Txt
                                txt={`${formatSatStr(balance)} available`}
                                styles={[
                                    styles.seamlessMintBalance,
                                    { color: color.TEXT },
                                ]}
                            />
                        )}
                    </View>
                    {!aiPathfindingEnabled && (
                        <ChevronRightIcon
                            color={color.TEXT_SECONDARY}
                            width={16}
                            height={16}
                        />
                    )}
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
                behavior={isIOS ? "padding" : undefined}
                style={styles.actionWrap}
            >
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
                <Button
                    outlined={!input.length}
                    disabled={loading}
                    txt={input.length ? t("continue") : t("createViaLn")}
                    onPress={() => void handleBtnPress()}
                    icon={loading ? <Loading size={20} /> : undefined}
                />
                {isIOS && <View style={styles.placeholder} />}
            </KeyboardAvoidingView>

            {/* Mint Selection Sheet with Multi-Select Support */}
            <Suspense fallback={<View />}>
                <MintSelectionSheet
                    ref={mintSelectionSheetRef}
                    selectedMint={selectedMint!}
                    selectedMints={selectedMints.map((mint) => ({
                        mintUrl: mint.mintUrl,
                    }))}
                    onMintSelect={handleMintSelect}
                    onMultipleMintSelect={handleMultipleMintSelect}
                    multiSelect={true}
                />
            </Suspense>
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        flexDirection: "column",
        justifyContent: "space-between",
        paddingBottom: isIOS ? "50@vs" : "20@vs",
        paddingTop: "90@vs",
    },
    hint: {
        paddingHorizontal: "20@s",
        marginBottom: "20@vs",
        fontWeight: "500",
    },
    feeHint: {
        fontSize: "10@vs",
        paddingHorizontal: "20@s",
        marginTop: "10@vs",
    },
    pasteInputTxtWrap: {
        position: "absolute",
        right: "10@s",
        top: "10@vs",
        padding: "10@s",
    },
    overviewWrap: {
        width: "100%",
        paddingVertical: "20@vs",
        paddingBottom: "20@vs",
        marginBottom: 0,
    },
    actionWrap: {
        paddingHorizontal: "20@s",
    },
    loadingWrap: {
        marginTop: "40@vs",
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
    aiPathfindingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "20@s",
        paddingVertical: "12@vs",
        marginHorizontal: "20@s",
        marginTop: "16@vs",
        borderRadius: "8@s",
        borderWidth: 1,
    },
    aiPathfindingContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    aiPathfindingText: {
        fontSize: "12@s",
        marginLeft: "8@s",
    },
    checkbox: {
        width: "20@s",
        height: "20@s",
        borderRadius: "4@s",
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
