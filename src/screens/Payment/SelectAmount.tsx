import { useShakeAnimation } from "@comps/animation/Shake";
import Button, { IconBtn } from "@comps/Button";
import { ChevronRightIcon, ArrowDownIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import MintSelectionSheet from "@comps/MintSelectionSheet";
import { isIOS } from "@consts";
import { l } from "@log";
import type { TSelectAmountPageProps } from "@model/nav";
import { useFocusEffect } from "@react-navigation/native";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { useKnownMints, KnownMintWithBalance } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import {
    cleanUpNumericStr,
    formatInt,
    formatSatStr,
    getInvoiceFromLnurl,
    vib,
} from "@util";
import {
    getLnurlIdentifierFromMetadata,
    isLightningAddress,
} from "@util/lnurl";
import { checkFees, requestMint } from "@wallet";
import { createRef, useCallback, useEffect, useRef, useState } from "react";
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
    const { lnurl, isMelt, isSendEcash, isSwap, targetMint, scanned } =
        route.params || {};
    const { openPromptAutoClose } = usePromptContext();
    const { t } = useTranslation([NS.wallet]);
    const { color, highlight } = useThemeContext();
    const { hidden } = usePrivacyContext();
    const { anim, shake } = useShakeAnimation();
    const { knownMints } = useKnownMints();
    const numericInputRef = createRef<TextInput>();
    const txtInputRef = createRef<TextInput>();
    const mintSelectionSheetRef = useRef<BottomSheet>(null);
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");

    // Use first mint from knownMints as default, ensure we always have a mint
    const defaultMint = knownMints.length > 0 ? knownMints[0] : null;
    const [selectedMint, setSelectedMint] =
        useState<KnownMintWithBalance | null>(defaultMint);

    // If no mints available, render empty state or redirect
    if (!selectedMint || knownMints.length === 0) {
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
    // invoice amount too low
    const [err, setErr] = useState(false);
    const [shouldEstimate, setShouldEstimate] = useState(false);
    const [fee, setFee] = useState({ estimation: 0, isCalculating: false });

    // Get balance for the selected mint (fallback to 0 if no mint selected)
    const selectedMintBalance = selectedMint?.balance || 0;
    const balTooLow =
        (isMelt || isSwap) && +amount + fee.estimation > selectedMintBalance;

    const isSendingWholeMintBal = () => {
        // includes fee
        if (isMelt && +amount + fee.estimation === selectedMintBalance) {
            return true;
        }
        // without fee
        if (isSendEcash && +amount === selectedMintBalance) {
            return true;
        }
        return false;
    };

    // navigation screen name
    const getScreenName = () => {
        if (isMelt) {
            return "cashOut";
        }
        if (isSwap) {
            return "multimintSwap";
        }
        if (isSendEcash) {
            return "sendEcash";
        }
        return "createInvoice";
    };

    const handleFeeEstimation = async () => {
        setFee((prev) => ({ ...prev, isCalculating: true }));
        try {
            // check fee for payment to lnurl
            if (lnurl) {
                const lnurlInvoice = await getInvoiceFromLnurl(
                    lnurl.userInput,
                    +amount
                );
                if (!lnurlInvoice?.length) {
                    openPromptAutoClose({
                        msg: t("feeErr", { ns: NS.common, input: lnurl.url }),
                    });
                    return setFee((prev) => ({
                        ...prev,
                        isCalculating: false,
                    }));
                }
                const estFee = await checkFees(
                    selectedMint!.mintUrl,
                    lnurlInvoice
                );
                setFee({ estimation: estFee, isCalculating: false });
                return setShouldEstimate(false);
            }
            // check fee for multimint swap
            if (isSwap && route.params.targetMint?.mintUrl.length) {
                const { pr } = await requestMint(
                    route.params.targetMint.mintUrl,
                    +amount
                );
                // const invoice = await getInvoice(hash)
                const estFee = await checkFees(selectedMint!.mintUrl, pr);
                setFee({ estimation: estFee, isCalculating: false });
                setShouldEstimate(false);
            }
        } catch (e) {
            l(e);
            openPromptAutoClose({ msg: t("requestMintErr", { ns: NS.error }) });
            setFee((prev) => ({ ...prev, isCalculating: false }));
        }
    };

    const getActionBtnTxt = () => {
        if (!isMelt && !isSwap && !isSendEcash) {
            return t("continue", { ns: NS.common });
        }
        if (fee.isCalculating) {
            return t("calculateFeeEst", { ns: NS.common });
        }
        if (balTooLow) {
            return t("balTooLow", { ns: NS.common });
        }
        return t(shouldEstimate ? "estimateFee" : "continue", {
            ns: NS.common,
        });
    };

    const onMemoChange = useCallback((text: string) => setMemo(text), []);

    const handleMintSelect = (mint: KnownMintWithBalance) => {
        setSelectedMint(mint);
        // Reset amount and fee when mint changes
        setAmount("");
        setFee({ estimation: 0, isCalculating: false });
        setShouldEstimate(!isSendEcash);
    };

    const handleMintSelectionOpen = () => {
        // Blur the text inputs when opening the sheet
        numericInputRef.current?.blur();
        txtInputRef.current?.blur();

        console.log(
            "Opening mint selection sheet, ref:",
            !!mintSelectionSheetRef.current
        );

        // Try expand method first, fallback to snapToIndex
        if (mintSelectionSheetRef.current) {
            try {
                mintSelectionSheetRef.current.expand();
            } catch (error) {
                console.log("Expand failed, trying snapToIndex:", error);
                mintSelectionSheetRef.current.snapToIndex(0);
            }
        }
    };

    const handleInputFocus = () => {
        // Close the mint selection sheet when input is focused
        mintSelectionSheetRef.current?.close();
    };

    const handleAmountSubmit = () => {
        if (fee.isCalculating || balTooLow) {
            return;
        }
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
        // estimate melting/swap fee
        if (!isSendEcash && shouldEstimate && (lnurl || isSwap)) {
            return handleFeeEstimation();
        }
        // send ecash / melt / swap
        if (isSendingTX) {
            const recipient = isLightningAddress(lnurl?.userInput || "")
                ? lnurl?.userInput
                : lnurl?.data
                ? getLnurlIdentifierFromMetadata(lnurl.data?.metadata)
                : undefined;
            // Check if user melts/swaps his whole mint balance, so there is no need for coin selection and that can be skipped here
            if (!isSendEcash && isSendingWholeMintBal()) {
                return navigation.navigate("processing", {
                    mint: selectedMint!,
                    amount: +amount,
                    estFee: fee.estimation,
                    isMelt,
                    isSendEcash,
                    isSwap,
                    targetMint: route.params.targetMint,
                    recipient,
                });
            }
            return navigation.navigate("coinSelection", {
                mint: selectedMint!,
                balance: selectedMintBalance,
                amount: +amount,
                memo,
                estFee: fee.estimation,
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
    };

    // auto-focus numeric input when the screen gains focus
    useFocusEffect(
        useCallback(() => {
            const timeoutId = setTimeout(() => {
                if (!txtInputRef.current?.isFocused()) {
                    numericInputRef.current?.focus();
                }
            }, 200);
            return () => clearTimeout(timeoutId);
        }, [txtInputRef, numericInputRef])
    );

    // check if is melting process
    useEffect(() => setShouldEstimate(!isSendEcash), [isSendEcash]);

    // estimate fee each time the melt or swap amount changes
    useEffect(() => {
        if (isSendEcash) {
            return;
        }
        setFee({ estimation: 0, isCalculating: false });
        setShouldEstimate(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount]);

    return (
        <Screen
            screenName={t(getScreenName(), { ns: NS.common })}
            withBackBtn
            handlePress={() =>
                scanned
                    ? navigation.navigate("qr scan", {})
                    : navigation.goBack()
            }
            mintBalance={selectedMintBalance}
            disableMintBalance={isMelt || isSwap || hidden.balance}
            handleMintBalancePress={() => setAmount(`${selectedMintBalance}`)}
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

            {/* Mint Selection Button */}
            <TouchableOpacity
                style={[
                    styles.mintSelector,
                    {
                        backgroundColor: color.INPUT_BG,
                        borderColor: color.BORDER,
                    },
                ]}
                onPress={handleMintSelectionOpen}
            >
                <View style={styles.mintSelectorInfo}>
                    <Txt
                        txt={
                            selectedMint!.name ||
                            new URL(selectedMint!.mintUrl).hostname
                        }
                        styles={[
                            styles.mintSelectorName,
                            { color: color.TEXT },
                        ]}
                    />
                    <Txt
                        txt={`${formatSatStr(selectedMintBalance)} available`}
                        styles={[
                            styles.mintSelectorBalance,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    />
                </View>
                <ArrowDownIcon
                    color={color.TEXT_SECONDARY}
                    width={16}
                    height={16}
                />
            </TouchableOpacity>
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
                        cursorColor={hi[highlight]}
                        placeholderTextColor={
                            err ? mainColors.ERROR : hi[highlight]
                        }
                        style={[
                            globals().selectAmount,
                            { color: err ? mainColors.ERROR : hi[highlight] },
                        ]}
                        onChangeText={(amountt) =>
                            setAmount(cleanUpNumericStr(amountt))
                        }
                        onSubmitEditing={() => void handleAmountSubmit()}
                        onFocus={handleInputFocus}
                        value={amount}
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
                            onSubmitEditing={() => void handleAmountSubmit()}
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
                            onPress={() => void handleAmountSubmit()}
                            icon={<ChevronRightIcon color={mainColors.WHITE} />}
                            size={s(55)}
                            testId="continue-send-ecash"
                        />
                    </>
                ) : (
                    <Button
                        txt={getActionBtnTxt()}
                        outlined={shouldEstimate}
                        onPress={() => void handleAmountSubmit()}
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

            <MintSelectionSheet
                ref={mintSelectionSheetRef}
                selectedMint={selectedMint!}
                onMintSelect={handleMintSelect}
            />
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
    mintSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "20@s",
        paddingVertical: "16@vs",
        marginHorizontal: "20@s",
        marginBottom: "16@vs",
        borderRadius: "12@s",
        borderWidth: 1,
    },
    mintSelectorInfo: {
        flex: 1,
    },
    mintSelectorName: {
        fontSize: "16@s",
        fontWeight: "500",
        marginBottom: "4@vs",
    },
    mintSelectorBalance: {
        fontSize: "12@s",
    },
});
