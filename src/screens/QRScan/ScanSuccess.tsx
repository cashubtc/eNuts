import Button, { TxtButton } from "@comps/Button";
import Logo from "@comps/Logo";
import type { TBeforeRemoveEvent, TScanSuccessPageProps } from "@model/nav";
import { preventBack } from "@nav/utils";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { useQRScanHandler } from "@util/qrScanner";
import { globals } from "@styles";
import { formatMintUrl } from "@util";
import AnimatedLottieView from "lottie-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView, Text, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function ScanSuccessScreen({
    navigation,
    route,
}: TScanSuccessPageProps) {
    const { mintUrl, edited } = route.params;
    const { t } = useTranslation([NS.mints]);
    const { color } = useThemeContext();
    const { openQRScanner } = useQRScanHandler(navigation);

    const handleTopUp = () => {
        if (!mintUrl) {
            return;
        }
        navigation.navigate("selectAmount", {
            mint: { mintUrl, customName: "" },
            balance: 0,
        });
    };

    // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
    useEffect(() => {
        const backHandler = (e: TBeforeRemoveEvent) =>
            preventBack(e, navigation.dispatch);
        navigation.addListener("beforeRemove", backHandler);
        return () => navigation.removeListener("beforeRemove", backHandler);
    }, [navigation]);

    return (
        <View style={[globals(color).container, styles.container]}>
            <View />
            <View style={styles.infoWrap}>
                <Logo size={100} success />
                <Text style={[styles.successTxt, { color: color.TEXT }]}>
                    {t("newMintAdded")}
                </Text>
                <Text style={[styles.mint, { color: color.TEXT_SECONDARY }]}>
                    {mintUrl ? formatMintUrl(mintUrl) : "N/A"}
                </Text>
                <AnimatedLottieView
                    source={require("../../../assets/lottie/success.json")}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                    renderMode="HARDWARE"
                />
            </View>
            <SafeAreaView style={styles.actionWrap}>
                <Button
                    txt={t("topUpNow", { ns: NS.common })}
                    onPress={handleTopUp}
                />
                <View style={{ marginVertical: vs(10) }} />
                {!edited && (
                    <Button
                        txt={t("scanAnother", { ns: NS.common })}
                        outlined
                        onPress={() => void openQRScanner()}
                    />
                )}
                <TxtButton
                    txt={t("backToDashboard", { ns: NS.common })}
                    onPress={() => navigation.navigate("dashboard")}
                    style={[{ marginTop: edited ? s(-20) : 0 }]}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20@s",
    },
    infoWrap: {
        alignItems: "center",
    },
    actionWrap: {
        width: "100%",
    },
    successTxt: {
        fontSize: "28@vs",
        fontWeight: "800",
        textAlign: "center",
        marginTop: "30@vs",
    },
    mint: {
        marginVertical: "20@vs",
        fontSize: "14@vs",
        textAlign: "center",
        fontWeight: "500",
    },
    lottie: {
        width: "100@s",
        height: "100@s",
    },
});
