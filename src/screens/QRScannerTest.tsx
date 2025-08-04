import { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Alert, Linking } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";

import Button from "@comps/Button";
import Empty from "@comps/Empty";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import StaticQRMarker from "@comps/StaticQRMarker";
import TopNav from "@nav/TopNav";
import { isIOS, QRType } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import type { TQRScannerTestPageProps } from "@model/nav";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";

// Constants for test screen
const CAMERA_READY_DELAY = isIOS ? 1000 : 300;
const QR_MARKER_SIZE = 250;

export default function QRScannerTest({ navigation }: TQRScannerTestPageProps) {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Handle camera permissions
    const requestCameraPermission = useCallback(async () => {
        console.log(
            "🎥 [TEST] Requesting camera permission on platform:",
            isIOS ? "iOS" : "Android"
        );
        console.log(
            "📋 [TEST] Current permission state before request:",
            permission
        );

        const result = await requestPermission();
        console.log("📝 [TEST] Camera permission result:", {
            granted: result.granted,
            status: result.status,
            canAskAgain: result.canAskAgain,
            expires: result.expires,
        });

        if (!result.granted) {
            console.warn("❌ [TEST] Camera permission denied");
            Alert.alert(
                "Camera Permission Required",
                "This test screen needs camera access to test QR code scanning",
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
                `📱 [TEST] Camera permission granted, setting up camera with ${CAMERA_READY_DELAY}ms delay`
            );
            setTimeout(() => {
                console.log(
                    "🎯 [TEST] Camera ready state set to true after permission grant"
                );
                setCameraReady(true);
            }, CAMERA_READY_DELAY);
        }
    }, [requestPermission, navigation]);

    // Initialize camera when screen becomes active
    const initializeCamera = useCallback(async () => {
        if (!permission?.granted) {
            console.log("🚫 [TEST] Permission not granted, requesting...");
            await requestCameraPermission();
        } else {
            console.log(
                "✅ [TEST] Permissions already granted, activating camera"
            );
            if (isIOS) {
                console.log(
                    `⏱️ [TEST] iOS: Setting camera ready after ${
                        CAMERA_READY_DELAY / 2
                    }ms delay`
                );
                setTimeout(() => {
                    console.log(
                        "🎯 [TEST] iOS: Camera ready state set after delay"
                    );
                    setCameraReady(true);
                }, CAMERA_READY_DELAY / 2);
            } else {
                console.log("🚀 [TEST] Android: Camera ready immediately");
                setCameraReady(true);
            }
        }
    }, [permission, requestCameraPermission]);

    const handleBarCodeScanned = useCallback(
        ({ type, data }: { type: string; data: string }) => {
            if (processing || scanned) return;

            console.log("📱 [TEST] QR Code scanned:", { type, data });
            setScanned(true);
            setProcessing(true);

            try {
                const bcType = isIOS ? "org.iso.QRCode" : +QRType;

                if (type !== bcType) {
                    console.warn("⚠️ [TEST] Not a QR code:", type);
                    setScanResult(`Not a QR code. Type: ${type}`);
                    setProcessing(false);
                    return;
                }

                console.log("✅ [TEST] Valid QR code scanned:", data);
                setScanResult(`✅ SUCCESS: ${data}`);
                setProcessing(false);
            } catch (error) {
                console.error("❌ [TEST] Scan error:", error);
                setScanResult(`❌ ERROR: ${error}`);
                setProcessing(false);
            }
        },
        [processing, scanned]
    );

    const resetScan = () => {
        setScanned(false);
        setProcessing(false);
        setScanResult(null);
    };

    const toggleCamera = () => {
        if (cameraActive) {
            setCameraActive(false);
            setCameraReady(false);
            setScanned(false);
            setProcessing(false);
            setScanResult(null);
        } else {
            setCameraActive(true);
            void initializeCamera();
        }
    };

    return (
        <Screen screenName="QR Scanner Test" withBackBtn>
            <TopNav
                screenName="QR Scanner Test"
                withBackBtn
                handlePress={() => navigation.goBack()}
            />

            <View style={styles.container}>
                <View style={styles.infoSection}>
                    <Text style={[styles.infoText, { color: color.TEXT }]}>
                        This is a test screen to debug QR scanner functionality
                        outside of bottom sheets.
                    </Text>
                    <Text
                        style={[
                            styles.statusText,
                            { color: color.TEXT_SECONDARY },
                        ]}
                    >
                        Platform: {isIOS ? "iOS" : "Android"} | Permission:{" "}
                        {permission?.granted ? "✅" : "❌"} | Camera:{" "}
                        {cameraReady ? "✅" : "❌"}
                    </Text>
                </View>

                <View style={styles.controls}>
                    <Button
                        txt={cameraActive ? "Stop Camera" : "Start Camera"}
                        onPress={toggleCamera}
                        outlined={cameraActive}
                    />
                </View>

                {scanResult && (
                    <View style={styles.resultContainer}>
                        <Text
                            style={[styles.resultText, { color: color.TEXT }]}
                        >
                            {scanResult}
                        </Text>
                        <Button
                            txt="Clear Result"
                            onPress={() => setScanResult(null)}
                        />
                    </View>
                )}

                {cameraActive && (
                    <View style={styles.cameraContainer}>
                        {!permission?.granted ? (
                            <Empty txt="Camera access required for testing" />
                        ) : !cameraReady ? (
                            <View style={styles.cameraLoading}>
                                <Loading size={40} />
                                <Text
                                    style={[
                                        styles.cameraLoadingText,
                                        { color: color.TEXT },
                                    ]}
                                >
                                    Loading camera...
                                </Text>
                                {isIOS && (
                                    <Text
                                        style={[
                                            styles.cameraHintText,
                                            { color: color.TEXT_SECONDARY },
                                        ]}
                                    >
                                        iOS camera initialization in progress...
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View style={styles.cameraWrapper}>
                                <CameraView
                                    style={styles.camera}
                                    facing="back"
                                    mode="picture"
                                    onBarcodeScanned={
                                        scanned
                                            ? undefined
                                            : handleBarCodeScanned
                                    }
                                    barcodeScannerSettings={{
                                        barcodeTypes: ["qr"],
                                    }}
                                    onCameraReady={() => {
                                        console.log(
                                            "✅ [TEST] Camera successfully mounted and ready on platform:",
                                            isIOS ? "iOS" : "Android"
                                        );
                                    }}
                                    onMountError={(error) => {
                                        console.error(
                                            "❌ [TEST] Camera mount error:",
                                            error
                                        );
                                        setScanResult(
                                            `❌ Camera Error: ${error}`
                                        );
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
                                                Scan Again
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {processing && (
                                    <View style={styles.processingOverlay}>
                                        <Loading size={40} />
                                        <Text style={styles.processingText}>
                                            Processing...
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Screen>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
        backgroundColor: mainColors.BLACK,
        padding: "20@s",
    },
    infoSection: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "15@s",
        borderRadius: "10@s",
        marginBottom: "20@vs",
    },
    infoText: {
        fontSize: "14@vs",
        fontWeight: "500",
        textAlign: "center",
        marginBottom: "10@vs",
    },
    statusText: {
        fontSize: "12@vs",
        textAlign: "center",
    },
    controls: {
        marginBottom: "20@vs",
    },
    resultContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "15@s",
        borderRadius: "10@s",
        marginBottom: "20@vs",
    },
    resultText: {
        fontSize: "14@vs",
        fontWeight: "500",
        marginBottom: "10@vs",
        textAlign: "center",
    },
    cameraContainer: {
        flex: 1,
        borderRadius: "10@s",
        overflow: "hidden",
        backgroundColor: mainColors.BLACK,
    },
    cameraWrapper: {
        flex: 1,
        position: "relative",
    },
    camera: {
        flex: 1,
        width: "100%",
        height: "100%",
        ...(isIOS && {
            overflow: "hidden",
            borderRadius: 0,
        }),
    },
    cameraLoading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mainColors.BLACK,
    },
    cameraLoadingText: {
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
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
        bottom: "50@vs",
        alignSelf: "center",
        padding: "15@s",
        backgroundColor: "rgba(0,0,0,.7)",
        borderRadius: "25@s",
    },
    scanAgainTxt: {
        fontSize: "14@vs",
        fontWeight: "500",
        color: mainColors.WHITE,
        textAlign: "center",
    },
    processingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    processingText: {
        color: mainColors.WHITE,
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
    },
});
