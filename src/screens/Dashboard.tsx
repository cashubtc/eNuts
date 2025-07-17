import { getDecodedToken, getEncodedToken, Token } from "@cashu/cashu-ts";
import Balance from "@comps/Balance";
import { IconBtn } from "@comps/Button";
import useLoading from "@comps/hooks/Loading";
import { PlusIcon, ReceiveIcon, ScanQRIcon, SendIcon } from "@comps/Icons";
import OptsModal from "@comps/modal/OptsModal";
import Txt from "@comps/Txt";
import { _testmintUrl, env } from "@consts";
import { getMintsUrls, hasMints } from "@db";
import { l } from "@log";
import type { TBeforeRemoveEvent, TDashboardPageProps } from "@model/nav";
import BottomNav from "@nav/BottomNav";
import { preventBack } from "@nav/utils";
import { useFocusClaimContext } from "@src/context/FocusClaim";
import { useHistoryContext } from "@src/context/History";
import { useInitialURL } from "@src/context/Linking";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { useTrustMintContext } from "@src/context/TrustMint";
import useKnownMints from "@src/hooks/useKnownMints";
import { NS } from "@src/i18n";
import { mintRepository } from "@src/storage/db/repo/MintRepository";
import { mintService } from "@src/wallet/services/MintService";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { getDefaultMint } from "@store/mintStore";
import { highlight as hi, mainColors } from "@styles";
import {
    extractStrFromURL,
    getStrFromClipboard,
    hasTrustedMint,
    isCashuToken,
    isLnInvoice,
    isStr,
} from "@util";
import { claimToken, getMintsForPayment } from "@wallet";
import { getTokenInfo, sumProofsValue } from "@wallet/proofs";
import { isValidCashuToken } from "@wallet/util";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
    const { t } = useTranslation([NS.common]);
    // The URL content that redirects to this app after clicking on it (cashu:)
    const { url, clearUrl } = useInitialURL();
    // Theme
    const { color, highlight } = useThemeContext();
    // State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
    const { claimed } = useFocusClaimContext();
    // Loading state
    const { loading, startLoading, stopLoading } = useLoading();
    // Prompt modal
    const { openPromptAutoClose } = usePromptContext();
    const { addHistoryEntry } = useHistoryContext();
    // Trust mint modal
    const { showTrustMintModal } = useTrustMintContext();
    const knownMints = useKnownMints();
    // modals
    const [modal, setModal] = useState({
        receiveOpts: false,
        sendOpts: false,
    });

    const receiveToken = async (token: Token) => {
        if (loading) {
            return;
        }
        startLoading();
        try {
            const success = await claimToken(token);
            if (success) {
                openPromptAutoClose({
                    msg: t("claimSuccess", {
                        amount: sumProofsValue(token.proofs),
                        mintUrl: token.mint,
                        memo: token.memo,
                    }),
                    success: true,
                });
                // add as history entry
                await addHistoryEntry({
                    amount: sumProofsValue(token.proofs),
                    type: 1,
                    value: getEncodedToken(token),
                    mints: [token.mint],
                });
                return;
            }
            openPromptAutoClose({ msg: t("claimTokenErr") });
        } catch (e) {
            l(e);
            openPromptAutoClose({ msg: t("claimTokenErr") });
        } finally {
            stopLoading();
        }
    };

    const handleTrustFlow = async (token: Token) => {
        const mintInfo = await mintService.getUnknownMintInfo(token.mint);
        try {
            const action = await showTrustMintModal(token);

            if (action === "trust") {
                await mintRepository.saveKnownMint(token.mint, mintInfo);
                await receiveToken(token);
            } else if (action === "swap") {
                // The swap navigation is handled in the modal itself
                // No additional action needed here
            }
            // If action is 'cancel', do nothing
        } catch (e) {
            l(e);
            openPromptAutoClose({ msg: t("claimTokenErr") });
        }
    };

    const handleClaimBtnPress = async () => {
        if (loading) {
            return;
        }
        startLoading();
        const clipboard = await getStrFromClipboard();
        let decoded: Token;
        try {
            if (!clipboard) {
                throw new Error("Clipboard is empty");
            }
            decoded = getDecodedToken(clipboard);
            if (!decoded) {
                throw new Error("Clipboard is not a valid cashu token");
            }
        } catch {
            openPromptAutoClose({ msg: t("clipboardInvalid") });
            closeOptsModal();
            stopLoading();
            return;
        }

        const knownMints = await mintService.getAllKnownMints();
        if (!knownMints.find((m) => m.mintUrl === decoded.mint)) {
            closeOptsModal();
            stopLoading();
            // Show trust modal
            await handleTrustFlow(decoded);
            return;
        }

        await receiveToken(decoded);
        closeOptsModal();
    };

    const handleMintBtnPress = async () => {
        const { mintsBals, mints } = await getMintsForPayment();
        closeOptsModal();
        const nonEmptyMints = mintsBals.filter((m) => m.amount > 0);
        // user has only 1 mint with balance, he can skip the mint selection
        if (nonEmptyMints.length === 1) {
            return navigation.navigate("selectAmount", {
                mint: mints.find(
                    (m) => m.mintUrl === nonEmptyMints[0].mintUrl
                ) || { mintUrl: "N/A", customName: "N/A" },
                balance: nonEmptyMints[0].amount,
            });
        }
        // user has more than 1 mint so he has to choose the one he wants to communicate to
        navigation.navigate("selectMint", {
            mints,
            mintsWithBal: mintsBals,
            allMintsEmpty: !nonEmptyMints.length,
        });
    };

    const handleSendBtnPress = async ({
        isMelt,
        isSendEcash,
    }: {
        isMelt?: boolean;
        isSendEcash?: boolean;
    } = {}) => {
        const { mintsBals, mints } = await getMintsForPayment();
        closeOptsModal();
        const nonEmptyMints = mintsBals.filter((m) => m.amount > 0);
        // user has only 1 mint with balance, he can skip the mint selection
        if (nonEmptyMints.length === 1) {
            // user can directly navigate to amount selection
            if (isSendEcash) {
                navigation.navigate("selectAmount", {
                    mint: mints.find(
                        (m) => m.mintUrl === nonEmptyMints[0].mintUrl
                    ) || { mintUrl: "N/A", customName: "N/A" },
                    balance: nonEmptyMints[0].amount,
                    isSendEcash,
                });
                return;
            }
            // otherwise he can select his target, get remaining mints for a possible multimint swap
            const remainingMints = mints.filter(
                (m) => m.mintUrl !== _testmintUrl
            );
            navigation.navigate("selectTarget", {
                mint: mints.find(
                    (m) => m.mintUrl === nonEmptyMints[0].mintUrl
                ) || { mintUrl: "N/A", customName: "N/A" },
                balance: nonEmptyMints[0].amount,
                isMelt,
                isSendEcash,
                remainingMints,
            });
            return;
        }
        // user has more than 1 mint so he has to choose the one he wants to communicate to
        navigation.navigate("selectMint", {
            mints,
            mintsWithBal: mintsBals,
            allMintsEmpty: !nonEmptyMints.length,
            isMelt,
            isSendEcash,
        });
    };

    // close send/receive options modal
    const closeOptsModal = () =>
        setModal((prev) => ({ ...prev, receiveOpts: false, sendOpts: false }));

    // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
    useEffect(() => {
        const backHandler = (e: TBeforeRemoveEvent) =>
            preventBack(e, navigation.dispatch);
        navigation.addListener("beforeRemove", backHandler);
        return () => navigation.removeListener("beforeRemove", backHandler);
    }, [navigation]);

    return (
        <View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
            {/* Balance, Disclaimer & History */}
            <Balance nav={navigation} />
            {/* Receive/send/mints buttons */}
            <View style={[styles.actionWrap, { paddingHorizontal: s(20) }]}>
                {/* Send button or add first mint */}
                {knownMints.length > 0 ? (
                    <ActionBtn
                        icon={
                            <SendIcon
                                width={s(32)}
                                height={s(32)}
                                color={hi[highlight]}
                            />
                        }
                        txt={t("send", { ns: NS.wallet })}
                        color={hi[highlight]}
                        onPress={() => {
                            setModal((prev) => ({ ...prev, sendOpts: true }));
                        }}
                    />
                ) : (
                    <ActionBtn
                        icon={
                            <PlusIcon
                                width={s(36)}
                                height={s(36)}
                                color={hi[highlight]}
                            />
                        }
                        txt={t("mint")}
                        color={hi[highlight]}
                        onPress={() => {
                            navigation.navigate("mints");
                        }}
                    />
                )}
                <ActionBtn
                    icon={
                        <ScanQRIcon
                            width={s(32)}
                            height={s(32)}
                            color={hi[highlight]}
                        />
                    }
                    txt={t("scan")}
                    color={hi[highlight]}
                    onPress={() =>
                        navigation.navigate("qr scan", { mint: undefined })
                    }
                />
                <ActionBtn
                    icon={
                        <ReceiveIcon
                            width={s(32)}
                            height={s(32)}
                            color={hi[highlight]}
                        />
                    }
                    txt={t("receive", { ns: NS.wallet })}
                    color={hi[highlight]}
                    onPress={() => {
                        // if (!hasMint) {
                        //     // try to claim from clipboard to avoid receive-options-modal to popup and having to press again
                        //     return handleClaimBtnPress();
                        // }
                        setModal((prev) => ({ ...prev, receiveOpts: true }));
                    }}
                />
            </View>
            {/* beta warning */}
            {(env.isExpoBeta || __DEV__) && (
                <View style={styles.hintWrap}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("disclaimer")}
                        style={styles.betaHint}
                    >
                        <Txt txt="BETA" styles={[{ color: mainColors.WARN }]} />
                    </TouchableOpacity>
                </View>
            )}
            {/* Bottom nav icons */}
            <BottomNav navigation={navigation} route={route} />
            {/* Send options */}
            <OptsModal
                visible={modal.sendOpts}
                button1Txt={t("sendEcash")}
                onPressFirstBtn={() =>
                    void handleSendBtnPress({ isSendEcash: true })
                }
                button2Txt={t("payLNInvoice", { ns: NS.wallet })}
                onPressSecondBtn={() =>
                    void handleSendBtnPress({ isMelt: true })
                }
                onPressCancel={closeOptsModal}
                isSend
            />
            {/* Receive options */}
            <OptsModal
                visible={modal.receiveOpts}
                button1Txt={
                    loading
                        ? t("claiming", { ns: NS.wallet })
                        : t("pasteToken", { ns: NS.wallet })
                }
                onPressFirstBtn={() => void handleClaimBtnPress()}
                button2Txt={t("createLnInvoice")}
                onPressSecondBtn={() => void handleMintBtnPress()}
                onPressCancel={closeOptsModal}
                loading={loading}
            />
        </View>
    );
}

interface IActionBtnsProps {
    icon: React.ReactNode;
    txt: string;
    onPress: () => void;
    color: string;
    disabled?: boolean;
}

function ActionBtn({ icon, onPress, txt, color, disabled }: IActionBtnsProps) {
    return (
        <View style={styles.btnWrap}>
            <IconBtn
                icon={icon}
                size={s(60)}
                outlined
                onPress={onPress}
                disabled={disabled}
                testId={`${txt}-btn`}
            />
            <Txt
                txt={txt}
                bold
                styles={[styles.btnTxt, { color, opacity: disabled ? 0.5 : 1 }]}
            />
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
    },
    actionWrap: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "-30@s",
    },
    btnWrap: {
        alignItems: "center",
        minWidth: "100@s",
    },
    btnTxt: {
        marginTop: "10@s",
    },
    hintWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "50@s",
    },
    betaHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: "20@s",
        paddingVertical: "10@s",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: mainColors.WARN,
        borderRadius: "50@s",
        minWidth: "120@s",
    },
});
