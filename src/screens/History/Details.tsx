import { IconBtn } from "@comps/Button";
import Copy from "@comps/Copy";
import {
    BitcoinIcon,
    CoinIcon,
    ExclamationIcon,
    IncomingArrowIcon,
    OutgoingArrowIcon,
    SwapIcon,
    ZapIcon,
} from "@comps/Icons";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { _testmintUrl } from "@consts";
import type { IHistoryEntry } from "@model";
import type { THistoryEntryPageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { useHistoryContext } from "@src/context/History";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, mainColors } from "@styles";
import { formatInt, formatMintUrl, formatSatStr } from "@util";

const truncateStr = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "...";
};
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function HistoryEntryDetails({
    navigation,
    route,
}: THistoryEntryPageProps) {
    const { entry } = route.params;
    const { t } = useTranslation([NS.history]);
    const { color } = useThemeContext();
    const { checkLnPr } = useHistoryContext();
    const isReceive = entry.type === 1;
    const isSend = entry.type === 2;
    const isMelt = entry.type === 3;
    const isSwap = entry.type === 4;
    const isExpired = entry.isExpired;
    const isPending = entry.isPending;
    const isSpent = entry.isSpent;

    const handleLnPrCheck = async () => {
        if (!entry.value) {
            return;
        }
        await checkLnPr(entry.value);
    };

    const getEntryIcon = () => {
        if (isReceive) {
            return <IncomingArrowIcon color={mainColors.VALID} />;
        }
        if (isSend) {
            return <OutgoingArrowIcon color={mainColors.ERROR} />;
        }
        if (isMelt) {
            return <ZapIcon color={mainColors.ZAP} />;
        }
        if (isSwap) {
            return <SwapIcon color={mainColors.BLUE} />;
        }
        return <CoinIcon color={color.TEXT} />;
    };

    const getEntryAmount = () => {
        if (isReceive) {
            return `+${formatSatStr(entry.amount)}`;
        }
        if (isSend) {
            return `-${formatSatStr(entry.amount)}`;
        }
        if (isMelt) {
            return `-${formatSatStr(entry.amount)}`;
        }
        if (isSwap) {
            return `-${formatSatStr(entry.amount)}`;
        }
        return formatSatStr(entry.amount);
    };

    const getEntryAmountColor = () => {
        if (isReceive) {
            return mainColors.VALID;
        }
        if (isSend) {
            return mainColors.ERROR;
        }
        if (isMelt) {
            return mainColors.ZAP;
        }
        if (isSwap) {
            return mainColors.BLUE;
        }
        return color.TEXT;
    };

    const getEntryType = () => {
        if (isReceive) {
            return t("receive");
        }
        if (isSend) {
            return t("send");
        }
        if (isMelt) {
            return t("melt");
        }
        if (isSwap) {
            return t("swap");
        }
        return t("unknown");
    };

    const getEntryDescription = () => {
        if (isReceive) {
            return t("receivedEcash");
        }
        if (isSend) {
            return t("sentEcash");
        }
        if (isMelt) {
            return t("paidInvoice");
        }
        if (isSwap) {
            return t("swappedFunds");
        }
        return t("unknownEntry");
    };

    return (
        <View style={[globals(color).container, styles.container]}>
            <TopNav
                screenName={t("details")}
                withBackBtn
                handlePress={() => navigation.goBack()}
            />
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.overview}>
                    <View
                        style={[
                            styles.overviewIcon,
                            { backgroundColor: color.INPUT_BG },
                        ]}
                    >
                        {getEntryIcon()}
                    </View>
                    <Txt
                        txt={getEntryAmount()}
                        styles={[
                            styles.amount,
                            { color: getEntryAmountColor() },
                        ]}
                    />
                    <Txt
                        txt={getEntryType()}
                        styles={[styles.type, { color: color.TEXT_SECONDARY }]}
                    />
                    <Txt
                        txt={getEntryDescription()}
                        styles={[
                            styles.description,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    />
                </View>
                <Separator style={[styles.separator]} />
                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Txt
                            txt={t("date")}
                            styles={[
                                styles.detailLabel,
                                { color: color.TEXT_SECONDARY },
                            ]}
                        />
                        <Txt
                            txt={new Date(
                                entry.timestamp * 1000
                            ).toLocaleString()}
                            styles={[styles.detailValue, { color: color.TEXT }]}
                        />
                    </View>
                    <View style={styles.detailRow}>
                        <Txt
                            txt={t("amount")}
                            styles={[
                                styles.detailLabel,
                                { color: color.TEXT_SECONDARY },
                            ]}
                        />
                        <Txt
                            txt={formatSatStr(entry.amount)}
                            styles={[styles.detailValue, { color: color.TEXT }]}
                        />
                    </View>
                    {entry.fee && entry.fee > 0 && (
                        <View style={styles.detailRow}>
                            <Txt
                                txt={t("fee")}
                                styles={[
                                    styles.detailLabel,
                                    { color: color.TEXT_SECONDARY },
                                ]}
                            />
                            <Txt
                                txt={formatSatStr(entry.fee)}
                                styles={[
                                    styles.detailValue,
                                    { color: color.TEXT },
                                ]}
                            />
                        </View>
                    )}
                    {entry.mints && entry.mints.length > 0 && (
                        <View style={styles.detailRow}>
                            <Txt
                                txt={t("mints")}
                                styles={[
                                    styles.detailLabel,
                                    { color: color.TEXT_SECONDARY },
                                ]}
                            />
                            <View style={styles.mints}>
                                {entry.mints.map((mint, index) => (
                                    <Txt
                                        key={index}
                                        txt={formatMintUrl(mint)}
                                        styles={[
                                            styles.detailValue,
                                            { color: color.TEXT },
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                    {entry.recipient && (
                        <View style={styles.detailRow}>
                            <Txt
                                txt={t("recipient")}
                                styles={[
                                    styles.detailLabel,
                                    { color: color.TEXT_SECONDARY },
                                ]}
                            />
                            <Txt
                                txt={truncateStr(entry.recipient, 20)}
                                styles={[
                                    styles.detailValue,
                                    { color: color.TEXT },
                                ]}
                            />
                        </View>
                    )}
                    {entry.sender && (
                        <View style={styles.detailRow}>
                            <Txt
                                txt={t("sender")}
                                styles={[
                                    styles.detailLabel,
                                    { color: color.TEXT_SECONDARY },
                                ]}
                            />
                            <Txt
                                txt={truncateStr(entry.sender, 20)}
                                styles={[
                                    styles.detailValue,
                                    { color: color.TEXT },
                                ]}
                            />
                        </View>
                    )}
                </View>
                {entry.value && (
                    <>
                        <Separator style={[styles.separator]} />
                        <View style={styles.tokenSection}>
                            <View style={styles.tokenHeader}>
                                <Txt
                                    txt={t("token")}
                                    styles={[
                                        styles.sectionTitle,
                                        { color: color.TEXT },
                                    ]}
                                />
                                <Copy txt={entry.value} />
                            </View>
                            <View
                                style={[
                                    styles.tokenContainer,
                                    { backgroundColor: color.INPUT_BG },
                                ]}
                            >
                                <Txt
                                    txt={truncateStr(entry.value, 100)}
                                    styles={[
                                        styles.tokenValue,
                                        { color: color.TEXT_SECONDARY },
                                    ]}
                                />
                            </View>
                        </View>
                    </>
                )}
                {isPending && (
                    <>
                        <Separator style={[styles.separator]} />
                        <View style={styles.actionSection}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    { backgroundColor: color.INPUT_BG },
                                ]}
                                onPress={() => void handleLnPrCheck()}
                            >
                                <Txt
                                    txt={t("checkPayment")}
                                    styles={[{ color: color.TEXT }]}
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        paddingTop: "90@vs",
    },
    scrollContainer: {
        flex: 1,
    },
    overview: {
        alignItems: "center",
        paddingVertical: "20@vs",
        paddingHorizontal: "15@s",
    },
    overviewIcon: {
        width: "60@s",
        height: "60@s",
        borderRadius: "30@s",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "10@vs",
    },
    amount: {
        fontSize: "40@vs",
        fontWeight: "600",
    },
    type: {
        fontSize: "14@vs",
        marginTop: "5@vs",
    },
    description: {
        fontSize: "14@vs",
        marginTop: "5@vs",
        textAlign: "center",
    },
    separator: {
        marginVertical: "10@vs",
    },
    details: {
        paddingHorizontal: "15@s",
        paddingBottom: "15@vs",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: "10@vs",
    },
    detailLabel: {
        fontSize: "14@vs",
    },
    detailValue: {
        fontSize: "14@vs",
    },
    mints: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    tokenSection: {
        paddingHorizontal: "15@s",
        paddingBottom: "15@vs",
    },
    tokenHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10@vs",
    },
    sectionTitle: {
        fontSize: "16@vs",
        fontWeight: "600",
    },
    tokenValue: {
        fontSize: "14@vs",
    },
    tokenContainer: {
        padding: "10@s",
        borderRadius: "8@s",
    },
    actionSection: {
        paddingHorizontal: "15@s",
        paddingBottom: "15@vs",
    },
    actionButton: {
        paddingVertical: "10@vs",
        paddingHorizontal: "15@s",
        borderRadius: "8@s",
        alignItems: "center",
        justifyContent: "center",
    },
});
