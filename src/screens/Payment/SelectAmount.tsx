import { useShakeAnimation } from "@comps/animation/Shake";
import Button, { IconBtn } from "@comps/Button";
import { ChevronRightIcon, ArrowDownIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
// Lazy load the MintSelectionSheet to improve initial render
const MintSelectionSheet = lazy(() => import("@comps/MintSelectionSheet"));
import { isIOS } from "@consts";
import type { TSelectAmountPageProps } from "@model/nav";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatInt, formatSatStr, vib } from "@util";
import {
    getLnurlIdentifierFromMetadata,
    isLightningAddress,
} from "@util/lnurl";
import { useCallback, useRef, useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    KeyboardAvoidingView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import BottomSheet from "@gorhom/bottom-sheet";

export default function SelectAmountScreen({
    navigation,
    route,
}: TSelectAmountPageProps) {
    const { lnurl, isMelt, isSendEcash, isSwap, scanned } = route.params || {};
    const { t } = useTranslation([NS.wallet]);
    const { color, highlight } = useThemeContext();
    const { hidden } = usePrivacyContext();
    const { anim, shake } = useShakeAnimation();
    const { knownMints } = useKnownMints();

    // Use useRef instead of createRef to avoid recreation on every render
    const numericInputRef = useRef<TextInput>(null);
    const txtInputRef = useRef<TextInput>(null);
    const mintSelectionSheetRef = useRef<BottomSheet>(null);

    const [amount, setAmount] = useState(0);
    const [memo, setMemo] = useState("");

    // Fee estimation state for melt operations
    const [fee, setFee] = useState({ estimation: 0, isCalculating: false });
    const shouldEstimate = isMelt && amount > 0;

    const defaultMint = useMemo(() => {
        return knownMints.length > 0 ? knownMints[0] : null;
    }, [knownMints]);

    const [selectedMint, setSelectedMint] =
        useState<KnownMintWithBalance | null>(defaultMint);

    const noMintsAvailable = useMemo(() => {
        return !selectedMint || knownMints.length === 0;
    }, [selectedMint, knownMints.length]);

    // Memoize expensive URL hostname extraction
    const selectedMintName = useMemo(() => {
        if (!selectedMint) return "";
        try {
            return selectedMint.name || new URL(selectedMint.mintUrl).hostname;
        } catch {
            return selectedMint.mintUrl;
        }
    }, [selectedMint]);

    // Memoize style objects to prevent recreation
    const globalStyles = useMemo(() => globals(), []);

    // Defer non-critical state initialization
    const [err, setErr] = useState(false);

    // Get balance for the selected mint (fallback to 0 if no mint selected)
    const selectedMintBalance = selectedMint?.balance || 0;
    const balTooLow = amount > selectedMintBalance;

    // Memoize screen name computation
    const screenName = useMemo(() => {
        if (isMelt) return "cashOut";
        if (isSwap) return "multimintSwap";
        if (isSendEcash) return "sendEcash";
        return "createInvoice";
    }, [isMelt, isSwap, isSendEcash]);

    // Memoize action button text
    const actionBtnTxt = useMemo(() => {
        if (!isMelt && !isSwap && !isSendEcash) {
            return t("continue", { ns: NS.common });
        }
        if (balTooLow) {
            return t("balTooLow", { ns: NS.common });
        }
        return t("continue", {
            ns: NS.common,
        });
    }, [isMelt, isSwap, isSendEcash, balTooLow, t]);

    const onMemoChange = useCallback((text: string) => setMemo(text), []);

    const handleMintSelect = useCallback(
        (mint: KnownMintWithBalance) => {
            setSelectedMint(mint);
        },
        [setSelectedMint]
    );

    const handleMintSelectionOpen = useCallback(() => {
        // Blur the text inputs when opening the sheet
        numericInputRef.current?.blur();
        txtInputRef.current?.blur();

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

    const handleAmountSubmit = useCallback(() => {
        const isSendingTX = isSendEcash || isMelt || isSwap;
        // error & shake animation if amount === 0 or greater than mint balance
        if (
            !amount ||
            +amount < 1 ||
            (isSendingTX && +amount > selectedMintBalance)
        ) {
            vib(400);
            setErr(true);
            shake();
            const t = setTimeout(() => {
                setErr(false);
                clearTimeout(t);
            }, 500);
            return;
        }
        if (isSendingTX) {
            const recipient = isLightningAddress(lnurl?.userInput || "")
                ? lnurl?.userInput
                : lnurl?.data
                ? getLnurlIdentifierFromMetadata(lnurl.data?.metadata)
                : undefined;
            return navigation.navigate("coinSelection", {
                mint: selectedMint!,
                balance: selectedMintBalance,
                amount: +amount,
                memo,
                estFee: 0,
                isMelt,
                isSendEcash,
                isSwap,
                targetMint: route.params.targetMint,
                recipient,
            });
        }
        // request new token from mint
        navigation.navigate("processing", {
            mint: selectedMint!,
            amount: +amount,
        });
    }, [
        balTooLow,
        isSendEcash,
        isMelt,
        isSwap,
        amount,
        selectedMintBalance,
        lnurl,
        navigation,
        selectedMint,
        route.params.targetMint,
        memo,
    ]);

    // Early return after all hooks
    if (noMintsAvailable) {
        return (
            <Screen
                screenName={t("selectAmount", { ns: NS.common })}
                withBackBtn
                handlePress={() => navigation.goBack()}
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
        <Screen
            screenName={t(screenName, { ns: NS.common })}
            withBackBtn
            handlePress={() =>
                scanned
                    ? navigation.navigate("qr scan", {})
                    : navigation.goBack()
            }
        >
            {!isMelt && !isSwap && (
                <Txt
                    txt={t(
                        isSendEcash ? "ecashAmountHint" : "invoiceAmountHint",
                        { ns: NS.mints }
                    )}
                    styles={[styles.headerHint]}
                />
            )}

            <View
                style={[
                    styles.overviewWrap,
                    { marginTop: isMelt || isSwap ? 0 : vs(20) },
                ]}
            >
                {lnurl && (lnurl.data || lnurl.userInput) && (
                    <Txt
                        txt={
                            isLightningAddress(lnurl.userInput)
                                ? lnurl.userInput
                                : lnurl.data
                                ? `${getLnurlIdentifierFromMetadata(
                                      lnurl.data.metadata
                                  )} requests ${
                                      lnurl.data.minSendable / 1000
                                  } to ${formatInt(
                                      lnurl.data.maxSendable / 1000
                                  )} Sats.`
                                : ""
                        }
                        bold
                        styles={[
                            styles.sats,
                            { marginBottom: vs(5), fontSize: s(10) },
                        ]}
                    />
                )}
                <Animated.View
                    style={[
                        styles.amountWrap,
                        { transform: [{ translateX: anim.current }] },
                    ]}
                >
                    <TextInput
                        keyboardType="numeric"
                        ref={numericInputRef}
                        placeholder="0"
                        autoFocus
                        cursorColor={hi[highlight]}
                        placeholderTextColor={
                            err ? mainColors.ERROR : hi[highlight]
                        }
                        style={[
                            globalStyles.selectAmount,
                            { color: err ? mainColors.ERROR : hi[highlight] },
                        ]}
                        onChangeText={(amount) =>
                            setAmount(parseInt(amount) || 0)
                        }
                        onSubmitEditing={handleAmountSubmit}
                        onFocus={handleInputFocus}
                        value={amount.toString()}
                        maxLength={8}
                        testID="mint-amount-input"
                    />
                </Animated.View>
                <Txt
                    txt={formatSatStr(+amount, "standard", false)}
                    styles={[styles.sats, { color: color.TEXT_SECONDARY }]}
                />
                {(isMelt || isSwap) && (
                    <>
                        <Separator style={[{ marginVertical: vs(20) }]} />
                        <MeltOverview
                            amount={+amount}
                            shouldEstimate={shouldEstimate}
                            balTooLow={balTooLow}
                            fee={fee.estimation}
                        />
                        <Txt
                            txt={
                                "* " + t("cashOutAmountHint", { ns: NS.mints })
                            }
                            styles={[
                                styles.feeHint,
                                { color: color.TEXT_SECONDARY },
                            ]}
                        />
                    </>
                )}
            </View>

            {/* Mint Selection Button - More seamless design */}
            <TouchableOpacity
                style={[
                    styles.seamlessMintSelector,
                    { borderColor: color.BORDER },
                ]}
                onPress={handleMintSelectionOpen}
            >
                <View style={styles.mintSelectorInfo}>
                    <Txt
                        txt={`Pay from: ${selectedMintName}`}
                        styles={[
                            styles.seamlessMintName,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    />
                    <Txt
                        txt={`${formatSatStr(selectedMintBalance)} available`}
                        styles={[
                            styles.seamlessMintBalance,
                            { color: color.TEXT },
                        ]}
                    />
                </View>
                <ChevronRightIcon
                    color={color.TEXT_SECONDARY}
                    width={16}
                    height={16}
                />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={isIOS ? "padding" : undefined}
                style={isSendEcash ? styles.actionWrap : styles.continue}
            >
                {isSendEcash ? (
                    <>
                        <TextInput
                            keyboardType="default"
                            ref={txtInputRef}
                            placeholder={t("optionalMemo", { ns: NS.common })}
                            placeholderTextColor={color.INPUT_PH}
                            selectionColor={hi[highlight]}
                            cursorColor={hi[highlight]}
                            onChangeText={onMemoChange}
                            onSubmitEditing={handleAmountSubmit}
                            onFocus={handleInputFocus}
                            maxLength={21}
                            style={[
                                styles.memoInput,
                                {
                                    color: color?.TEXT,
                                    backgroundColor: color?.INPUT_BG,
                                },
                            ]}
                        />
                        <IconBtn
                            onPress={handleAmountSubmit}
                            icon={<ChevronRightIcon color={mainColors.WHITE} />}
                            size={s(55)}
                            testId="continue-send-ecash"
                        />
                    </>
                ) : (
                    <Button
                        txt={actionBtnTxt}
                        onPress={handleAmountSubmit}
                        disabled={balTooLow}
                        icon={
                            fee.isCalculating ? (
                                <Loading color={hi[highlight]} />
                            ) : undefined
                        }
                    />
                )}
                {isIOS && (
                    <View style={{ height: isSendEcash ? vs(100) : vs(20) }} />
                )}
            </KeyboardAvoidingView>

            <Suspense fallback={<View />}>
                <MintSelectionSheet
                    ref={mintSelectionSheetRef}
                    selectedMint={selectedMint!}
                    onMintSelect={handleMintSelect}
                />
            </Suspense>
        </Screen>
    );
}

interface IMeltOverviewProps {
    amount: number;
    shouldEstimate?: boolean;
    balTooLow?: boolean;
    isInvoice?: boolean;
    fee: number;
}

export function MeltOverview({
    amount,
    shouldEstimate,
    balTooLow,
    isInvoice,
    fee,
}: IMeltOverviewProps) {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();
    return (
        <View style={styles.overview}>
            <Txt
                txt={
                    t(isInvoice ? "invoiceInclFee" : "totalInclFee", {
                        ns: NS.common,
                    }) + "*"
                }
                bold
            />
            <Txt
                txt={formatSatStr(shouldEstimate ? 0 : amount + fee)}
                styles={[
                    {
                        color:
                            !shouldEstimate && balTooLow
                                ? mainColors.ERROR
                                : shouldEstimate
                                ? color.TEXT
                                : mainColors.VALID,
                    },
                ]}
            />
        </View>
    );
}

const styles = ScaledSheet.create({
    headerHint: {
        paddingHorizontal: "20@s",
        marginBottom: "20@vs",
        fontWeight: "500",
    },
    amountWrap: {
        width: "100%",
        alignItems: "center",
    },
    continue: {
        flex: 1,
        position: "absolute",
        right: "20@s",
        left: "20@s",
        bottom: "20@vs",
        alignItems: "center",
    },
    overviewWrap: {
        width: "100%",
        paddingHorizontal: "20@s",
    },
    overview: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sats: {
        fontSize: "12@vs",
        textAlign: "center",
        marginLeft: "-4@s",
        marginTop: "-5@vs",
    },
    feeHint: {
        fontSize: "10@vs",
        marginTop: "10@vs",
    },
    actionWrap: {
        flex: 1,
        position: "absolute",
        bottom: "20@vs",
        left: "20@s",
        right: "20@s",
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "100%",
    },
    memoInput: {
        flex: 1,
        marginRight: "20@s",
        paddingHorizontal: "18@s",
        paddingVertical: "18@vs",
        borderRadius: 50,
        fontSize: "14@vs",
    },

    mintSelectorInfo: {
        flex: 1,
    },
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
    seamlessMintName: {
        fontSize: "12@s",
        marginBottom: "2@vs",
    },
    seamlessMintBalance: {
        fontSize: "14@s",
        fontWeight: "500",
    },
});
