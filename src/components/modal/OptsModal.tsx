import { TxtButton } from "@comps/Button";
import { CopyIcon, SendMsgIcon, ZapIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

import MyModal from ".";

interface IOptsModal {
    visible: boolean;
    button1Txt: string;
    onPressFirstBtn: () => void;
    button2Txt: string;
    onPressSecondBtn: () => void;
    onPressCancel: () => void;
    loading?: boolean;
    isSend?: boolean;
}

export default function OptsModal({
    visible,
    button1Txt,
    onPressFirstBtn,
    button2Txt,
    onPressSecondBtn,
    onPressCancel,
    loading,
    isSend,
}: IOptsModal) {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();
    return (
        <MyModal
            type="bottom"
            animation="slide"
            visible={visible}
            close={onPressCancel}
        >
            <Txt
                txt={
                    isSend
                        ? t("send", { ns: NS.wallet })
                        : t("receive", { ns: NS.wallet })
                }
                bold
                center
                styles={[styles.hint]}
            />
            <TouchableOpacity
                style={styles.container}
                onPress={onPressFirstBtn}
                testID="send-ecash-option"
            >
                <View style={styles.iconContainer}>
                    {isSend ? (
                        <SendMsgIcon
                            width={s(16)}
                            height={s(16)}
                            color={mainColors.VALID}
                        />
                    ) : loading ? (
                        <View>
                            <Loading size="small" color={mainColors.VALID} />
                        </View>
                    ) : (
                        <CopyIcon color={mainColors.VALID} />
                    )}
                </View>
                <View style={styles.txtWrap}>
                    <Text style={[styles.actionText, { color: color.TEXT }]}>
                        {button1Txt}
                    </Text>
                    <Text
                        style={[
                            styles.descriptionText,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    >
                        {isSend
                            ? t("sendEcashDashboard")
                            : t("receiveEcashDashboard")}
                    </Text>
                </View>
            </TouchableOpacity>
            <Separator style={[styles.separator]} />
            <TouchableOpacity
                style={styles.container}
                onPress={onPressSecondBtn}
                testID="pay-invoice-option"
            >
                <View style={styles.iconContainer}>
                    <ZapIcon
                        width={s(26)}
                        height={s(26)}
                        color={mainColors.ZAP}
                    />
                </View>
                <View style={styles.txtWrap}>
                    <Text style={[styles.actionText, { color: color.TEXT }]}>
                        {button2Txt}
                    </Text>
                    <Text
                        style={[
                            styles.descriptionText,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    >
                        {isSend
                            ? t("payInvoiceDashboard")
                            : t("createInvoiceDashboard")}
                    </Text>
                </View>
            </TouchableOpacity>
            <TxtButton
                txt={t("cancel")}
                onPress={onPressCancel}
                style={[{ paddingBottom: vs(15), paddingTop: vs(25) }]}
            />
        </MyModal>
    );
}

const styles = ScaledSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    iconContainer: {
        minWidth: "11%",
    },
    txtWrap: {
        width: "90%",
    },
    actionText: {
        fontSize: "14@vs",
        fontWeight: "500",
        marginBottom: "4@vs",
    },
    descriptionText: {
        fontSize: "12@vs",
    },
    hint: {
        fontSize: "18@vs",
        marginTop: "5@vs",
        marginBottom: "30@vs",
    },
    separator: {
        width: "100%",
        marginTop: "10@vs",
        marginBottom: "10@vs",
    },
});
