import Button from "@comps/Button";
import Empty from "@comps/Empty";
import { MintBoardIcon, ZapIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { _testmintUrl } from "@consts";
import type { IMintBalWithName } from "@model";
import type { TSelectMintPageProps } from "@model/nav";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { KnownMintWithBalance, useKnownMints } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { useQRScanHandler } from "@util/qrScanner";
import { getDefaultMint } from "@store/mintStore";
import { globals, highlight as hi } from "@styles";
import { formatInt, formatMintUrl, isNum, sortMintsByDefault } from "@util";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function SelectMintScreen({
    navigation,
    route,
}: TSelectMintPageProps) {
    // const {
    //     mints,
    //     mintsWithBal,
    //     allMintsEmpty,
    //     isMelt,
    //     isSendEcash,
    //     invoice,
    //     invoiceAmount,
    //     estFee,
    //     scanned,
    // } = route.params;
    const { openPromptAutoClose } = usePromptContext();
    const { hidden } = usePrivacyContext();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation([NS.wallet]);
    const { color, highlight } = useThemeContext();
    const { knownMints } = useKnownMints();
    const { openQRScanner } = useQRScanHandler(navigation);

    const mintsWithBalance = useMemo(() => {
        return knownMints.filter((m) => m.balance > 0);
    }, [knownMints]);

    // WARNING: Only for testing
    const isSendEcash = true;
    const isMelt = false;

    const getScreenName = () => {
        if (isMelt) {
            return "cashOut";
        }
        if (isSendEcash) {
            return "sendEcash";
        }
        return "createInvoice";
    };
    // screen text hint (short explaination about feature)
    const getScreenHint = () => {
        if (isMelt) {
            return "chooseMeltMintHint";
        }
        if (isSendEcash) {
            return "sendEcashHint";
        }
        return "chooseMintHint";
    };
    // press mint
    const handlePressMint = (mint: KnownMintWithBalance) => {
        // pay scanned invoice
        // if (invoice && invoiceAmount && isNum(estFee)) {
        //     if (invoiceAmount + estFee > mint.amount) {
        //         return openPromptAutoClose({
        //             msg: t("noFundsForFee", { ns: NS.common, fee: estFee }),
        //             ms: 4000,
        //         });
        //     }
        //     return navigation.navigate("coinSelection", {
        //         mint,
        //         balance: mint.amount,
        //         amount: invoiceAmount,
        //         estFee,
        //         isMelt: true,
        //         recipient: invoice,
        //     });
        // }
        // choose a target for a payment
        if (isMelt || isSendEcash) {
            // get remaining mints for a possible multimint swap
            const remainingMints = mintsWithBalance
                .filter(
                    (m) =>
                        m.mintUrl !== mint.mintUrl && m.mintUrl !== _testmintUrl
                )
                .map((m) => ({ mintUrl: m.mintUrl, customName: m.name }));
            // user has already selected a nostr target
            // l('user wants to send payment, navigate to target selection')
            return navigation.navigate("selectTarget", {
                mint,
                balance: mint.balance,
                remainingMints,
                isSendEcash,
                isMelt,
            });
        }
        navigation.navigate("selectAmount", {
            mint,
            balance: mint.balance,
            isSendEcash,
        });
    };

    return (
        <Screen
            screenName={t(getScreenName(), { ns: NS.common })}
            withBackBtn
            handlePress={() => {
                if (scanned) {
                    return void openQRScanner();
                }
                navigation.goBack();
            }}
        >
            {mintsWithBalance.length > 0 ? (
                <>
                    <Txt
                        styles={[styles.hint]}
                        txt={t(getScreenHint(), { ns: NS.mints })}
                    />
                    <ScrollView alwaysBounceVertical={false}>
                        <View style={globals(color).wrapContainer}>
                            {mintsWithBalance.map((m, i) => (
                                <View key={m.mintUrl}>
                                    <TouchableOpacity
                                        style={[
                                            globals().wrapRow,
                                            { paddingBottom: vs(15) },
                                        ]}
                                        onPress={() => handlePressMint(m)}
                                        disabled={
                                            (isSendEcash || isMelt) &&
                                            m.balance === 0
                                        }
                                    >
                                        <View style={styles.mintNameWrap}>
                                            <Txt
                                                txt={
                                                    m.name ||
                                                    formatMintUrl(m.mintUrl)
                                                }
                                                styles={[
                                                    {
                                                        color:
                                                            (isSendEcash ||
                                                                isMelt) &&
                                                            !m.balance
                                                                ? color.TEXT_SECONDARY
                                                                : color.TEXT,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <View style={styles.mintBal}>
                                            <Text
                                                style={[
                                                    styles.mintAmount,
                                                    {
                                                        color:
                                                            (isSendEcash ||
                                                                isMelt) &&
                                                            !m.balance
                                                                ? color.TEXT_SECONDARY
                                                                : color.TEXT,
                                                        paddingBottom: vs(3),
                                                    },
                                                ]}
                                            >
                                                {hidden.balance
                                                    ? "****"
                                                    : formatInt(
                                                          m.balance,
                                                          "compact",
                                                          "en"
                                                      )}
                                            </Text>
                                            <ZapIcon
                                                color={
                                                    (isSendEcash || isMelt) &&
                                                    !m.balance
                                                        ? color.TEXT_SECONDARY
                                                        : hi[highlight]
                                                }
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    {i < mintsWithBalance.length - 1 && (
                                        <Separator
                                            style={[{ marginBottom: vs(15) }]}
                                        />
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </>
            ) : (
                <Empty
                    txt={
                        t(
                            mintsWithBalance.length === 0
                                ? "noFunds"
                                : "noMint",
                            {
                                ns: NS.common,
                            }
                        ) + "..."
                    }
                />
            )}
            {(!knownMints.length || mintsWithBalance.length === 0) && (
                <View
                    style={[
                        styles.addNewMintWrap,
                        { bottom: vs(20) + insets.bottom },
                    ]}
                >
                    <Button
                        txt={t(
                            mintsWithBalance.length === 0
                                ? "mintNewTokens"
                                : "addNewMint",
                            {
                                ns: NS.mints,
                            }
                        )}
                        onPress={() => {
                            if (
                                mintsWithBalance.length === 0 &&
                                knownMints.length > 0
                            ) {
                                navigation.navigate("selectAmount", {
                                    mint: knownMints[0],
                                    balance: knownMints[0].balance,
                                });
                                return;
                            }
                            navigation.navigate("mints");
                        }}
                    />
                </View>
            )}
        </Screen>
    );
}

const styles = ScaledSheet.create({
    hint: {
        paddingHorizontal: "20@s",
        marginBottom: "20@vs",
        fontWeight: "500",
    },
    mintNameWrap: {
        flexDirection: "row",
        alignItems: "center",
    },
    mintBal: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    mintAmount: {
        marginRight: "5@s",
    },
    addNewMintWrap: {
        position: "absolute",
        right: "20@s",
        left: "20@s",
    },
});
