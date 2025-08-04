import { useCallback, useEffect, useState } from "react";
import {
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking,
    StatusBar,
} from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";

import Empty from "@comps/Empty";
import { IconBtn } from "@comps/Button";
import { LeftArrow } from "@comps/Icons";
import Loading from "@comps/Loading";
import StaticQRMarker from "@comps/StaticQRMarker";
import { isIOS, QRType } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { usePromptContext } from "@src/context/Prompt";
import { useTrustMintContext } from "@src/context/TrustMint";
import type { TQRScanPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { mainColors, highlight as hi } from "@styles";
import {
    decodeLnInvoice,
    extractStrFromURL,
    hasTrustedMint,
    isCashuToken,
    isStr,
} from "@util";
import { decodeUrlOrAddress, isLnurlOrAddress, isUrl } from "@util/lnurl";
import { getLnurlData } from "@src/util/lnurl";
import { getTokenInfo } from "@wallet/proofs";
import { addMint, getMintsBalances, getMintsUrls } from "@db";
import { getDefaultMint, getCustomMintNames } from "@store/mintStore";
import { checkFees, claimToken } from "@wallet";
import { l } from "@log";

// Constants
const CAMERA_READY_DELAY = isIOS ? 1000 : 300;
const QR_MARKER_SIZE = 250;

export default function QRScan({ navigation, route }: TQRScanPageProps) {
    const { mint, balance, isPayment } = route.params || {};
    const { t } = useTranslation([NS.common, NS.mints, NS.wallet, NS.error]);
    const { color, highlight } = useThemeContext();
    const { openPromptAutoClose } = usePromptContext();
    const { showTrustMintModal } = useTrustMintContext();
    const insets = useSafeAreaInsets();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Handle camera permissions
    const requestCameraPermission = useCallback(async () => {
        console.log(
            "🎥 [QR SCAN] Requesting camera permission on platform:",
            isIOS ? "iOS" : "Android"
        );

        const result = await requestPermission();
        console.log("📝 [QR SCAN] Camera permission result:", {
            granted: result.granted,
            status: result.status,
        });

        if (!result.granted) {
            console.warn("❌ [QR SCAN] Camera permission denied");
            Alert.alert(
                "Camera Permission Required",
                "Camera access is needed to scan QR codes",
                [
                    {
                        text: "Cancel",
                        onPress: () => navigation.goBack(),
                    },
                    {
                        text: "Settings",
                        onPress: () => {
                            navigation.goBack();
                            void Linking.openSettings?.();
                        },
                    },
                ]
            );
        } else {
            console.log(
                `📱 [QR SCAN] Camera permission granted, setting up camera with ${CAMERA_READY_DELAY}ms delay`
            );
            setTimeout(() => {
                console.log("🎯 [QR SCAN] Camera ready state set to true");
                setCameraReady(true);
            }, CAMERA_READY_DELAY);
        }
    }, [requestPermission, navigation]);

    // Initialize camera when screen loads
    useEffect(() => {
        if (!permission?.granted) {
            console.log("🚫 [QR SCAN] Permission not granted, requesting...");
            void requestCameraPermission();
        } else {
            console.log(
                "✅ [QR SCAN] Permissions already granted, activating camera"
            );
            if (isIOS) {
                console.log(
                    `⏱️ [QR SCAN] iOS: Setting camera ready after ${
                        CAMERA_READY_DELAY / 2
                    }ms delay`
                );
                setTimeout(() => {
                    console.log(
                        "🎯 [QR SCAN] iOS: Camera ready state set after delay"
                    );
                    setCameraReady(true);
                }, CAMERA_READY_DELAY / 2);
            } else {
                console.log("🚀 [QR SCAN] Android: Camera ready immediately");
                setCameraReady(true);
            }
        }
    }, [permission, requestCameraPermission]);

    // Process scanned QR data and route accordingly
    const processScannedData = useCallback(
        async (data: string) => {
            console.log("🔍 [QR SCAN] Processing scanned data:", data);

            try {
                // Handle Cashu token claim
                const cashuToken = isCashuToken(data);
                if (cashuToken) {
                    console.log("💰 [QR SCAN] Detected Cashu token");
                    await handleCashuToken(cashuToken);
                    return;
                }

                // Handle mint URLs
                if (isUrl(data) && new URL(data).protocol === "https:") {
                    console.log("🏦 [QR SCAN] Detected mint URL");
                    navigation.navigate("mint confirm", { mintUrl: data });
                    return;
                }

                // Handle LNURL
                if (isLnurlOrAddress(data)) {
                    console.log("🔗 [QR SCAN] Detected LNURL");
                    await handleLnurl(data);
                    return;
                }

                // Handle Lightning invoice
                try {
                    const invoice = extractStrFromURL(data) || data;
                    const { amount, timeLeft } = decodeLnInvoice(invoice);
                    if (timeLeft <= 0) {
                        openPromptAutoClose({ msg: t("invoiceExpired") });
                        return;
                    }

                    console.log("⚡ [QR SCAN] Detected Lightning invoice", {
                        amount,
                        timeLeft,
                    });
                    await handleLightningInvoice(invoice, amount);
                    return;
                } catch {
                    console.log("❓ [QR SCAN] Unknown QR code type");
                    openPromptAutoClose({
                        msg: t("unknownType") + ` "${data}"`,
                    });
                }
            } catch (error) {
                console.error("❌ [QR SCAN] Error processing QR data:", error);
                openPromptAutoClose({
                    msg:
                        t("scanError", { ns: NS.error }) ||
                        "Scan error occurred",
                });
            }
        },
        [navigation, t, openPromptAutoClose]
    );

    // Handle Cashu token processing
    const handleCashuToken = useCallback(
        async (data: string) => {
            const info = getTokenInfo(data);
            if (!info) {
                openPromptAutoClose({ msg: t("invalidOrSpent") });
                return;
            }

            // Check if user wants to trust the token mint
            const defaultM = await getDefaultMint();
            const userMints = await getMintsUrls();
            if (
                !hasTrustedMint(userMints, info.mints) ||
                (isStr(defaultM) && !info.mints.includes(defaultM))
            ) {
                try {
                    const action = await showTrustMintModal(info.decoded);
                    if (action === "trust") {
                        // Add mint to trusted mints
                        for (const mint of info.mints) {
                            await addMint({
                                mintUrl: mint,
                                id: "",
                                active: true,
                                fee: 0,
                            } as any);
                        }
                    } else if (action !== "swap") {
                        return; // User cancelled
                    }
                } catch (e) {
                    openPromptAutoClose({ msg: t("invalidOrSpent") });
                    return;
                }
            }

            // Claim the token
            const success = await claimToken(data as any).catch(l);
            if (!success) {
                navigation.navigate("processingError", {
                    errorMsg: t("invalidOrSpent", { ns: NS.common }),
                });
                return;
            }

            // Navigate to success
            navigation.navigate("success", {
                amount: info.value,
                memo: info.decoded?.memo,
                isClaim: true,
                isScanned: true,
            });
        },
        [navigation, t, openPromptAutoClose, showTrustMintModal]
    );

    // Handle LNURL processing
    const handleLnurl = useCallback(
        async (data: string) => {
            const decoded = decodeUrlOrAddress(data);
            if (!decoded) {
                openPromptAutoClose({
                    msg: t("unknownType") + ` - decoded LNURL: "${decoded}"`,
                });
                return;
            }

            try {
                const lnurlData = await getLnurlData(decoded);
                if (!lnurlData) {
                    navigation.navigate("processingError", {
                        errorMsg: "Could not fetch data from lnurl",
                        scan: true,
                    });
                    return;
                }

                if (lnurlData.tag !== "payRequest") {
                    navigation.navigate("processingError", {
                        errorMsg:
                            "Only LNURL pay requests are currently supported",
                        scan: true,
                    });
                    return;
                }

                // If mint and balance are already provided
                if (mint && balance) {
                    return navigation.navigate("selectAmount", {
                        isMelt: true,
                        scanned: true,
                        lnurl: {
                            userInput: data,
                            url: decoded,
                            data: lnurlData,
                        },
                    });
                }

                // Get available mints
                const mintsWithBal = await getMintsBalances();
                const mints = await getCustomMintNames(
                    mintsWithBal.map((m) => ({ mintUrl: m.mintUrl }))
                );
                const nonEmptyMint = mintsWithBal.filter((m) => m.amount > 0);

                // No funds available
                if (!nonEmptyMint.length) {
                    return navigation.navigate("selectMint", {
                        mints,
                        mintsWithBal,
                        isMelt: true,
                        allMintsEmpty: true,
                        scanned: true,
                        lnurl: {
                            userInput: data,
                            url: decoded,
                            data: lnurlData,
                        },
                    });
                }

                // Single mint with enough funds
                if (nonEmptyMint.length === 1) {
                    return navigation.navigate("selectAmount", {
                        isMelt: true,
                        scanned: true,
                        lnurl: {
                            userInput: data,
                            url: decoded,
                            data: lnurlData,
                        },
                    });
                }

                // Multiple mints available
                navigation.navigate("selectMint", {
                    mints,
                    mintsWithBal,
                    allMintsEmpty: !nonEmptyMint.length,
                    isMelt: true,
                    scanned: true,
                    lnurl: {
                        userInput: data,
                        url: decoded,
                        data: lnurlData,
                    },
                });
            } catch (e) {
                navigation.navigate("processingError", {
                    errorMsg: "Could not fetch data from lnurl",
                    scan: true,
                });
            }
        },
        [navigation, t, openPromptAutoClose, mint, balance]
    );

    // Handle Lightning invoice processing
    const handleLightningInvoice = useCallback(
        async (invoice: string, amount: number) => {
            // If payment context with mint and balance
            if (isPayment && mint && balance) {
                const estFee = await checkFees(mint.mintUrl, invoice);
                if (amount + estFee > balance) {
                    return navigation.navigate("processingError", {
                        errorMsg: t("noFundsForFee", {
                            ns: NS.common,
                            fee: estFee,
                        }),
                        scan: true,
                    });
                }
                return navigation.navigate("coinSelection", {
                    mint,
                    balance,
                    amount,
                    estFee,
                    recipient: invoice,
                    isMelt: true,
                    scanned: true,
                });
            }

            // If mint and balance are provided (but not payment context)
            if (mint && balance) {
                const estFee = await checkFees(mint.mintUrl, invoice);
                if (amount + estFee > balance) {
                    return navigation.navigate("processingError", {
                        errorMsg: t("noFundsForFee", {
                            ns: NS.common,
                            fee: estFee,
                        }),
                        scan: true,
                    });
                }
                return navigation.navigate("coinSelection", {
                    mint,
                    balance,
                    amount,
                    estFee,
                    recipient: invoice,
                    isMelt: true,
                    scanned: true,
                });
            }

            // General invoice handling - need to select mint
            const mintsWithBal = await getMintsBalances();
            const mints = await getCustomMintNames(
                mintsWithBal.map((m) => ({ mintUrl: m.mintUrl }))
            );
            const nonEmptyMint = mintsWithBal.filter((m) => m.amount > 0);

            // No funds
            if (!nonEmptyMint.length) {
                return navigation.navigate("selectMint", {
                    mints,
                    mintsWithBal,
                    isMelt: true,
                    invoice,
                    invoiceAmount: amount,
                    allMintsEmpty: true,
                    scanned: true,
                });
            }

            // Single mint
            if (nonEmptyMint.length === 1) {
                const mintUsing = mints.find(
                    (m) => m.mintUrl === nonEmptyMint[0].mintUrl
                ) || { mintUrl: "N/A", customName: "N/A" };
                const estFee = await checkFees(mintUsing.mintUrl, invoice);

                if (amount + estFee > nonEmptyMint[0].amount) {
                    return navigation.navigate("processingError", {
                        errorMsg: t("noFundsForFee", {
                            ns: NS.common,
                            fee: estFee,
                        }),
                        scan: true,
                    });
                }

                return navigation.navigate("coinSelection", {
                    mint: mintUsing,
                    balance: nonEmptyMint[0].amount,
                    amount,
                    estFee,
                    recipient: invoice,
                    isMelt: true,
                    scanned: true,
                });
            }

            // Multiple mints - let user choose
            const mintUsing = mints.find(
                (m) => m.mintUrl === nonEmptyMint[0].mintUrl
            ) || { mintUrl: "N/A", customName: "N/A" };
            const estFee = await checkFees(mintUsing.mintUrl, invoice);

            if (mintsWithBal.some((m) => m.amount >= amount + estFee)) {
                navigation.navigate("selectMint", {
                    mints,
                    mintsWithBal,
                    allMintsEmpty: !nonEmptyMint.length,
                    invoiceAmount: amount,
                    estFee,
                    invoice,
                    isMelt: true,
                    scanned: true,
                });
            } else {
                navigation.navigate("processingError", {
                    errorMsg: t("noFunds", { ns: NS.common }),
                    scan: true,
                });
            }
        },
        [navigation, t, mint, balance, isPayment]
    );

    const handleBarCodeScanned = useCallback(
        ({ type, data }: { type: string; data: string }) => {
            if (processing || scanned) return;

            console.log("📱 [QR SCAN] QR Code scanned:", { type, data });
            setScanned(true);
            setProcessing(true);

            try {
                const bcType = isIOS ? "org.iso.QRCode" : +QRType;

                if (type !== bcType) {
                    console.warn("⚠️ [QR SCAN] Not a QR code:", type);
                    openPromptAutoClose({
                        msg: t("notQrCode") || "Not a QR code",
                    });
                    setProcessing(false);
                    return;
                }

                console.log(
                    "✅ [QR SCAN] Valid QR code scanned, processing..."
                );
                void processScannedData(data.trim());
            } catch (error) {
                console.error("❌ [QR SCAN] Scan error:", error);
                openPromptAutoClose({
                    msg: t("scanError") || "Scan error occurred",
                });
                setProcessing(false);
            }
        },
        [processing, scanned, t, openPromptAutoClose, processScannedData]
    );

    const resetScan = () => {
        setScanned(false);
        setProcessing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            {/* Floating back button */}
            <View
                style={[styles.backButtonContainer, { top: insets.top + 10 }]}
            >
                <IconBtn
                    icon={<LeftArrow color={hi[highlight]} />}
                    size={44}
                    onPress={() => navigation.goBack()}
                />
            </View>

            <View style={styles.cameraSection}>
                {!permission?.granted ? (
                    <View
                        style={[
                            styles.permissionContainer,
                            { paddingTop: insets.top + 80 },
                        ]}
                    >
                        <Empty txt="Camera access required for scanning" />
                    </View>
                ) : !cameraReady ? (
                    <View
                        style={[
                            styles.cameraLoading,
                            { paddingTop: insets.top + 80 },
                        ]}
                    >
                        <Loading size={40} />
                        <Text
                            style={[
                                styles.cameraLoadingText,
                                { color: color.TEXT },
                            ]}
                        >
                            {t("loadingCamera") || "Loading camera..."}
                        </Text>
                        {isIOS && (
                            <Text
                                style={[
                                    styles.cameraHintText,
                                    { color: color.TEXT_SECONDARY },
                                ]}
                            >
                                Initializing camera...
                            </Text>
                        )}
                    </View>
                ) : (
                    <View
                        style={[
                            styles.cameraContainer,
                            {
                                marginTop: insets.top + 60,
                                marginBottom: insets.bottom + 20,
                            },
                        ]}
                    >
                        <View style={styles.cameraWrapper}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                mode="picture"
                                onBarcodeScanned={
                                    scanned ? undefined : handleBarCodeScanned
                                }
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                }}
                                onCameraReady={() => {
                                    console.log(
                                        "✅ [QR SCAN] Camera successfully mounted and ready on platform:",
                                        isIOS ? "iOS" : "Android"
                                    );
                                }}
                                onMountError={(error) => {
                                    console.error(
                                        "❌ [QR SCAN] Camera mount error:",
                                        error
                                    );
                                    openPromptAutoClose({
                                        msg:
                                            t("cameraError") ||
                                            "Camera failed to load. Please try again.",
                                    });
                                }}
                            />
                            <View style={styles.markerContainer}>
                                <StaticQRMarker
                                    size={QR_MARKER_SIZE}
                                    color={
                                        scanned
                                            ? mainColors.GREY
                                            : mainColors.WHITE
                                    }
                                />
                            </View>
                            {scanned && !processing && (
                                <View style={styles.scanAgain}>
                                    <TouchableOpacity onPress={resetScan}>
                                        <Text style={styles.scanAgainTxt}>
                                            {t("scanAgain")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {processing && (
                                <View style={styles.processingOverlay}>
                                    <Loading size={40} />
                                    <Text style={styles.processingText}>
                                        {t("processing")}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
    },
    backButtonContainer: {
        position: "absolute",
        left: "20@s",
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: "22@s",
    },
    cameraSection: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: "20@s",
    },
    cameraWrapper: {
        flex: 1,
        position: "relative",
        borderRadius: "20@s",
        overflow: "hidden",
        backgroundColor: mainColors.BLACK,
        elevation: 8,
        shadowColor: mainColors.BLACK,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    camera: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    cameraLoading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraLoadingText: {
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
        textAlign: "center",
    },
    cameraHintText: {
        fontSize: "12@vs",
        fontWeight: "400",
        marginTop: "10@vs",
        textAlign: "center",
        opacity: 0.7,
    },
    markerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    },
    scanAgain: {
        position: "absolute",
        bottom: "30@vs",
        alignSelf: "center",
        paddingHorizontal: "20@s",
        paddingVertical: "12@vs",
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: "25@s",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    scanAgainTxt: {
        fontSize: "14@vs",
        fontWeight: "600",
        color: mainColors.WHITE,
        textAlign: "center",
    },
    processingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20@s",
    },
    processingText: {
        color: mainColors.WHITE,
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
    },
});
