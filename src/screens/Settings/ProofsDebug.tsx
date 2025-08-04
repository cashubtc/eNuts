import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/core";
import { ScaledSheet } from "react-native-size-matters";
import { useThemeContext } from "@src/context/Theme";
import { proofService } from "@src/services/ProofService";
import { EnutsProof } from "@src/storage/db/repo/ProofRepository";
import Screen from "@comps/Screen";
import TopNav from "@comps/nav/TopNav";
import Txt from "@comps/Txt";
import Separator from "@comps/Separator";
import { mainColors } from "@styles";

export default function ProofsDebug() {
    const { color } = useThemeContext();
    const [proofs, setProofs] = useState<EnutsProof[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProofs = useCallback(async () => {
        try {
            const allProofs = await proofService.proofRepo.getAllProofs();
            setProofs(allProofs);
        } catch (error) {
            console.error("Failed to load proofs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProofs();
        }, [loadProofs])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadProofs();
    }, [loadProofs]);

    const formatDleq = (dleq: any) => {
        if (!dleq) return "None";
        return JSON.stringify(dleq, null, 2);
    };

    const getStateColor = (state: EnutsProof["state"]) => {
        switch (state) {
            case "ready":
                return mainColors.VALID;
            case "inflight":
                return mainColors.WARN;
            case "used":
                return mainColors.ERROR;
            default:
                return color.TEXT_SECONDARY;
        }
    };

    const groupedProofs = proofs.reduce((acc, proof) => {
        if (!acc[proof.mintUrl]) {
            acc[proof.mintUrl] = [];
        }
        acc[proof.mintUrl].push(proof);
        return acc;
    }, {} as Record<string, EnutsProof[]>);

    return (
        <Screen>
            <TopNav txt="Proofs Debug" />
            <ScrollView
                style={[
                    styles.container,
                    { backgroundColor: color.BACKGROUND },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[mainColors.VALID]}
                        tintColor={mainColors.VALID}
                    />
                }
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Txt
                            txt={`Total Proofs: ${proofs.length}`}
                            styles={[styles.headerText, { color: color.TEXT }]}
                        />
                        <Txt
                            txt={`Ready: ${
                                proofs.filter((p) => p.state === "ready").length
                            } | Inflight: ${
                                proofs.filter((p) => p.state === "inflight")
                                    .length
                            } | Used: ${
                                proofs.filter((p) => p.state === "used").length
                            }`}
                            styles={[
                                styles.subHeaderText,
                                { color: color.TEXT_SECONDARY },
                            ]}
                        />
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Txt
                                txt="Loading proofs..."
                                styles={[{ color: color.TEXT_SECONDARY }]}
                            />
                        </View>
                    ) : Object.keys(groupedProofs).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Txt
                                txt="No proofs found in database"
                                styles={[{ color: color.TEXT_SECONDARY }]}
                            />
                        </View>
                    ) : (
                        Object.entries(groupedProofs).map(
                            ([mintUrl, mintProofs]) => (
                                <View key={mintUrl} style={styles.mintSection}>
                                    <View style={styles.mintHeader}>
                                        <Txt
                                            txt={`Mint: ${mintUrl}`}
                                            styles={[
                                                styles.mintUrl,
                                                { color: color.TEXT },
                                            ]}
                                        />
                                        <Txt
                                            txt={`${mintProofs.length} proofs`}
                                            styles={[
                                                styles.mintCount,
                                                { color: color.TEXT_SECONDARY },
                                            ]}
                                        />
                                    </View>

                                    {mintProofs.map((proof, index) => (
                                        <View
                                            key={proof.secret}
                                            style={styles.proofContainer}
                                        >
                                            <View
                                                style={[
                                                    styles.proofHeader,
                                                    {
                                                        borderColor:
                                                            color.BORDER,
                                                    },
                                                ]}
                                            >
                                                <View
                                                    style={styles.proofTitleRow}
                                                >
                                                    <Txt
                                                        txt={`Proof #${
                                                            index + 1
                                                        }`}
                                                        styles={[
                                                            styles.proofTitle,
                                                            {
                                                                color: color.TEXT,
                                                            },
                                                        ]}
                                                    />
                                                    <View
                                                        style={[
                                                            styles.stateTag,
                                                            {
                                                                backgroundColor:
                                                                    getStateColor(
                                                                        proof.state
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.stateText
                                                            }
                                                        >
                                                            {proof.state.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.amountRow}>
                                                    <Txt
                                                        txt={`${proof.amount} sats`}
                                                        styles={[
                                                            styles.amount,
                                                            {
                                                                color: color.TEXT,
                                                            },
                                                        ]}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.proofDetails}>
                                                <View style={styles.detailRow}>
                                                    <Txt
                                                        txt="Keyset ID:"
                                                        styles={[
                                                            styles.detailLabel,
                                                            {
                                                                color: color.TEXT_SECONDARY,
                                                            },
                                                        ]}
                                                    />
                                                    <Txt
                                                        txt={proof.id}
                                                        styles={[
                                                            styles.detailValue,
                                                            {
                                                                color: color.TEXT,
                                                            },
                                                        ]}
                                                    />
                                                </View>

                                                <View style={styles.detailRow}>
                                                    <Txt
                                                        txt="Secret:"
                                                        styles={[
                                                            styles.detailLabel,
                                                            {
                                                                color: color.TEXT_SECONDARY,
                                                            },
                                                        ]}
                                                    />
                                                    <Txt
                                                        txt={proof.secret}
                                                        styles={[
                                                            styles.detailValueMono,
                                                            {
                                                                color: color.TEXT,
                                                            },
                                                        ]}
                                                    />
                                                </View>

                                                <View style={styles.detailRow}>
                                                    <Txt
                                                        txt="Commitment (C):"
                                                        styles={[
                                                            styles.detailLabel,
                                                            {
                                                                color: color.TEXT_SECONDARY,
                                                            },
                                                        ]}
                                                    />
                                                    <Txt
                                                        txt={proof.C}
                                                        styles={[
                                                            styles.detailValueMono,
                                                            {
                                                                color: color.TEXT,
                                                            },
                                                        ]}
                                                    />
                                                </View>

                                                {proof.dleq && (
                                                    <View
                                                        style={styles.detailRow}
                                                    >
                                                        <Txt
                                                            txt="DLEQ:"
                                                            styles={[
                                                                styles.detailLabel,
                                                                {
                                                                    color: color.TEXT_SECONDARY,
                                                                },
                                                            ]}
                                                        />
                                                        <Txt
                                                            txt={formatDleq(
                                                                proof.dleq
                                                            )}
                                                            styles={[
                                                                styles.detailValueMono,
                                                                {
                                                                    color: color.TEXT,
                                                                },
                                                            ]}
                                                        />
                                                    </View>
                                                )}
                                            </View>

                                            {index < mintProofs.length - 1 && (
                                                <Separator
                                                    style={[
                                                        {
                                                            backgroundColor:
                                                                color.BORDER,
                                                        },
                                                    ]}
                                                />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )
                        )
                    )}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: "20@s",
    },
    header: {
        marginBottom: "20@vs",
        alignItems: "center",
    },
    headerText: {
        fontSize: "18@vs",
        fontWeight: "600",
        marginBottom: "8@vs",
    },
    subHeaderText: {
        fontSize: "14@vs",
        fontWeight: "400",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: "50@vs",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: "50@vs",
    },
    mintSection: {
        marginBottom: "30@vs",
    },
    mintHeader: {
        marginBottom: "15@vs",
        paddingBottom: "10@vs",
        borderBottomWidth: 2,
        borderBottomColor: mainColors.GREY,
    },
    mintUrl: {
        fontSize: "16@vs",
        fontWeight: "600",
        marginBottom: "4@vs",
    },
    mintCount: {
        fontSize: "12@vs",
        fontWeight: "400",
    },
    proofContainer: {
        marginBottom: "15@vs",
    },
    proofHeader: {
        paddingBottom: "10@vs",
        borderBottomWidth: 1,
        marginBottom: "10@vs",
    },
    proofTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8@vs",
    },
    proofTitle: {
        fontSize: "14@vs",
        fontWeight: "600",
    },
    stateTag: {
        paddingHorizontal: "8@s",
        paddingVertical: "4@vs",
        borderRadius: "12@s",
    },
    stateText: {
        color: mainColors.WHITE,
        fontSize: "10@vs",
        fontWeight: "700",
    },
    amountRow: {
        alignItems: "flex-start",
    },
    amount: {
        fontSize: "16@vs",
        fontWeight: "700",
    },
    proofDetails: {
        gap: "8@vs",
    },
    detailRow: {
        marginBottom: "8@vs",
    },
    detailLabel: {
        fontSize: "12@vs",
        fontWeight: "600",
        marginBottom: "2@vs",
    },
    detailValue: {
        fontSize: "12@vs",
        fontWeight: "400",
    },
    detailValueMono: {
        fontSize: "10@vs",
        fontWeight: "400",
        fontFamily: "monospace",
        lineHeight: "14@vs",
    },
});
