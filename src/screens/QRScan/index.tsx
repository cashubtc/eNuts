import Empty from "@comps/Empty";
import useLoading from "@comps/hooks/Loading";
import useCashuToken from "@comps/hooks/Token";
import { CloseIcon, FlashlightOffIcon } from "@comps/Icons";
import { isIOS, QRType } from "@consts";
import { addMint, getMintsUrls } from "@db";
import TrustMintModal from "@modal/TrustMint";
import type { ITokenInfo } from "@model";
import type { TQRScanPageProps } from "@model/nav";
import { useIsFocused } from "@react-navigation/core";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { getDefaultMint } from "@store/mintStore";
import { globals, mainColors } from "@styles";
import {
    decodeLnInvoice,
    extractStrFromURL,
    hasTrustedMint,
    isCashuToken,
    isStr,
} from "@util";
import { decodeUrlOrAddress, isLnurlOrAddress, isUrl } from "@util/lnurl";
import { getTokenInfo } from "@wallet/proofs";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import QRMarker from "./Marker";

export default function QRScanPage({ navigation, route }: TQRScanPageProps) {
    const { mint, balance, isPayment } = route.params;
    const { t } = useTranslation([NS.common]);
    const { openPromptAutoClose } = usePromptContext();
    const { color } = useThemeContext();
    const isFocused = useIsFocused();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flash, setFlash] = useState(false);
    // prompt modal
    const { loading, startLoading, stopLoading } = useLoading();
    // cashu token
    const {
        token,
        setToken,
        tokenInfo,
        setTokenInfo,
        trustModal,
        setTrustModal,
    } = useCashuToken();

    const handleCashuToken = async (data: string) => {
        const info = getTokenInfo(data);
        if (!info) {
            return openPromptAutoClose({ msg: t("invalidOrSpent") });
        }
        // save token info in state
        setTokenInfo(info as ITokenInfo);
        // check if user wants to trust the token mint
        const defaultM = await getDefaultMint();
        const userMints = await getMintsUrls();
        if (
            !hasTrustedMint(userMints, info.mints) ||
            (isStr(defaultM) && !info.mints.includes(defaultM))
        ) {
            // ask user for permission if token mint is not in his mint list
            return setTrustModal(true);
        }
        navigation.navigate("qr processing", {
            tokenInfo: info as ITokenInfo,
            token: data,
        });
    };

    const handleTrustModal = async () => {
        if (loading) {
            return;
        }
        startLoading();
        if (!tokenInfo) {
            openPromptAutoClose({ msg: t("invalidToken") });
            stopLoading();
            return setTrustModal(false);
        }
        for (const mint of tokenInfo.mints) {
            await addMint(mint);
        }
        stopLoading();
        // close modal
        setTrustModal(false);
        navigation.navigate("qr processing", { tokenInfo, token });
    };

    const handleBarCodeScanned = ({
        type,
        data,
    }: {
        type: string;
        data: string;
    }) => {
        setScanned(true);
        const bcType = isIOS ? "org.iso.QRCode" : +QRType;
        // early return if barcode is not a QR
        if (type !== bcType) {
            return openPromptAutoClose({ msg: t("notQrCode") });
        }
        // handle cashu token claim
        const cashuToken = isCashuToken(data);
        if (cashuToken) {
            setToken(cashuToken);
            return handleCashuToken(cashuToken);
        }
        // handle mint urls
        if (isUrl(data) && new URL(data).protocol === "https:") {
            return navigation.navigate("mint confirm", { mintUrl: data });
        }
        // handle LNURL
        if (isLnurlOrAddress(data)) {
            const decoded = decodeUrlOrAddress(data);
            if (!decoded) {
                return openPromptAutoClose({
                    msg: t("unknownType") + ` - decoded LNURL: "${decoded}"`,
                });
            }
            return navigation.navigate("qr processing", {
                lnurl: { data, mint, balance, url: decoded },
                scanned: true,
            });
        }
        // handle LN invoice
        try {
            const invoice = extractStrFromURL(data) || data;
            const { amount, timeLeft } = decodeLnInvoice(invoice);
            if (timeLeft <= 0) {
                return openPromptAutoClose({ msg: t("invoiceExpired") });
            }
            if (isPayment) {
                return navigation.navigate("qr processing", {
                    ln: { invoice, mint, balance, amount },
                });
            }
            // user scanned a LN invoice but did not come from a payment screen
            return navigation.navigate("coinSelection", {
                mint: mint || { mintUrl: "", customName: "" },
                balance: balance || 0,
                amount,
                estFee: 0,
                isMelt: true,
                recipient: invoice,
                scanned: true,
            });
        } catch {
            return openPromptAutoClose({
                msg: t("unknownType") + ` "${data}"`,
            });
        }
    };

    useEffect(() => {
        if (!isFocused) {
            setScanned(false);
        }
    }, [isFocused]);

    useEffect(() => {
        if (!permission || !permission.granted) {
            void requestPermission();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={[globals(color).container, styles.container]}>
                <Empty txt={t("cameraAccess")} />
            </View>
        );
    }

    return (
        <View style={[globals(color).container, styles.container]}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                enableTorch={flash}
            />
            <QRMarker
                size={300}
                color={scanned ? mainColors.GREY : mainColors.WHITE}
            />
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <CloseIcon
                        width={s(22)}
                        height={s(22)}
                        color={mainColors.WHITE}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFlash((prev) => !prev)}>
                    <FlashlightOffIcon
                        width={s(22)}
                        height={s(22)}
                        color={mainColors.WHITE}
                    />
                </TouchableOpacity>
            </View>
            {scanned && (
                <View style={styles.scanAgain}>
                    <TouchableOpacity onPress={() => setScanned(false)}>
                        <Text style={styles.scanAgainTxt}>
                            {t("scanAgain")}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {isFocused && (
                <TrustMintModal
                    loading={loading}
                    tokenInfo={tokenInfo}
                    handleTrustModal={() => void handleTrustModal()}
                    closeModal={() => {
                        setTrustModal(false);
                        setToken("");
                    }}
                />
            )}
        </View>
    );
}

const styles = ScaledSheet.create({
    empty: {
        flex: 1,
        backgroundColor: mainColors.BLACK,
    },
    container: {
        paddingTop: 0,
        alignItems: "center",
    },
    scanAgain: {
        position: "absolute",
        bottom: "150@vs",
        padding: "20@s",
        backgroundColor: "rgba(0,0,0,.5)",
        borderRadius: 40,
    },
    scanAgainTxt: {
        fontSize: "14@vs",
        fontWeight: "500",
        color: mainColors.WHITE,
        textAlign: "center",
    },
    action: {
        position: "absolute",
        bottom: "40@vs",
        backgroundColor: "rgba(0,0,0,.5)",
        width: "60@s",
        height: "60@s",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "30@s",
    },
    left: {
        left: "40@s",
    },
    right: {
        right: "40@s",
    },
    camera: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    topNav: {
        position: "absolute",
        top: "40@vs",
        left: "40@s",
        right: "40@s",
        flexDirection: "row",
        justifyContent: "space-between",
        zIndex: 1,
    },
});
