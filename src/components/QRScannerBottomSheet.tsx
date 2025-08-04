import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View, Alert, Linking } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";

import Empty from "@comps/Empty";
import Loading from "@comps/Loading";
import StaticQRMarker from "@comps/StaticQRMarker";
import { isIOS, QRType } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { useQRScannerContext, type QRScanResult } from "@src/context/QRScanner";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";

// Constants
const CAMERA_READY_DELAY = isIOS ? 1000 : 300; // Even longer delay for iOS
const QR_MARKER_SIZE = 300;
const SNAP_POINTS = ["85%"];
const BACKDROP_OPACITY = 0.8;

export default function QRScannerBottomSheet() {
    const { t } = useTranslation([NS.common]);
    const { color } = useThemeContext();
    const { state, handleScanResult, closeScanner } = useQRScannerContext();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [permissionRequested, setPermissionRequested] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Handle camera permissions
    const requestCameraPermission = useCallback(async () => {
        console.log(
            "🎥 Requesting camera permission on platform:",
            isIOS ? "iOS" : "Android"
        );
        console.log("📋 Current permission state before request:", permission);

        const result = await requestPermission();
        console.log("📝 Camera permission result:", {
            granted: result.granted,
            status: result.status,
            canAskAgain: result.canAskAgain,
            expires: result.expires,
        });

        if (!result.granted) {
            console.warn("Camera permission denied");
            Alert.alert(
                t("cameraPermissionTitle") || "Camera Permission",
                t("cameraPermissionMessage") ||
                    "This app needs camera access to scan QR codes",
                [
                    {
                        text: t("cancel") || "Cancel",
                        onPress: closeScanner,
                    },
                    {
                        text: t("settings") || "Settings",
                        onPress: () => {
                            closeScanner();
                            void Linking.openSettings?.();
                        },
                    },
                ]
            );
        } else {
            console.log(
                `📱 Camera permission granted, setting up camera with ${CAMERA_READY_DELAY}ms delay`
            );
            // Small delay after permission grant to ensure camera is ready
            setTimeout(() => {
                console.log(
                    "🎯 Camera ready state set to true after permission grant"
                );
                setCameraReady(true);
            }, CAMERA_READY_DELAY);
        }
    }, [requestPermission, t, closeScanner]);

    // Request camera permissions when modal opens
    useEffect(() => {
        if (!state.visible) {
            console.log("QR Scanner not visible, skipping camera setup");
            return;
        }

        console.log("🔍 QR Scanner visible, checking permissions...", {
            permissionGranted: permission?.granted,
            permissionStatus: permission?.status,
            permissionRequested,
            platform: isIOS ? "iOS" : "Android",
            cameraReady,
        });

        if (!permission?.granted && !permissionRequested) {
            console.log("🚫 Permission not granted, requesting...");
            setPermissionRequested(true);
            void requestCameraPermission();
        } else if (permission?.granted) {
            console.log("✅ Permissions already granted, activating camera");
            // For iOS, add extra delay even when permission already granted
            if (isIOS) {
                console.log(
                    `⏱️ iOS: Setting camera ready after ${
                        CAMERA_READY_DELAY / 2
                    }ms delay`
                );
                setTimeout(() => {
                    console.log("🎯 iOS: Camera ready state set after delay");
                    setCameraReady(true);
                }, CAMERA_READY_DELAY / 2);
            } else {
                console.log("🚀 Android: Camera ready immediately");
                setCameraReady(true);
            }
        } else {
            console.log("⚠️ Unexpected permission state:", permission);
        }
    }, [
        state.visible,
        permission?.granted,
        permissionRequested,
        requestCameraPermission,
    ]);

    // Simple QR data processing - just return the raw scanned data
    const processQRData = useCallback((data: string): QRScanResult => {
        // Return raw scanned data
        return {
            success: true,
            data: data.trim(),
        };
    }, []);

    const handleBarCodeScanned = useCallback(
        ({ type, data }: { type: string; data: string }) => {
            if (processing || scanned) return;

            setScanned(true);
            setProcessing(true);

            try {
                const bcType = isIOS ? "org.iso.QRCode" : +QRType;

                if (type !== bcType) {
                    const result: QRScanResult = {
                        success: false,
                        error: t("notQrCode") || "Not a QR code",
                    };
                    handleScanResult(result);
                    return;
                }

                // Process the scanned data and return result
                const result = processQRData(data);
                handleScanResult(result);
            } catch (error) {
                const result: QRScanResult = {
                    success: false,
                    error: t("scanError") || "Scan error occurred",
                };
                handleScanResult(result);
            } finally {
                setProcessing(false);
            }
        },
        [processing, scanned, t, processQRData, handleScanResult]
    );

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={BACKDROP_OPACITY}
                pressBehavior="close"
                enableTouchThrough={false}
            />
        ),
        [] // No dependencies - completely static backdrop
    );

    // Handle modal presentation/dismissal
    useEffect(() => {
        if (state.visible) {
            // Reset scanning states before presenting to avoid re-renders
            setScanned(false);
            setProcessing(false);
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [state.visible]);

    // Handle dismiss completion with delay to avoid backdrop flickering
    const handleDismissComplete = useCallback(() => {
        console.log("QR Scanner dismissed, resetting states");
        // Delay state reset to allow dismiss animation to complete
        setTimeout(() => {
            setPermissionRequested(false);
            setScanned(false);
            setProcessing(false);
            setCameraReady(false);
        }, 300); // Match typical modal animation duration
    }, []);

    // Stable dismiss handler
    const handleModalDismiss = useCallback(() => {
        closeScanner();
        handleDismissComplete();
    }, [closeScanner, handleDismissComplete]);

    if (!permission) {
        return null;
    }

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={SNAP_POINTS}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={true}
            onDismiss={handleModalDismiss}
            backgroundStyle={{ backgroundColor: mainColors.BLACK }}
            handleIndicatorStyle={{ backgroundColor: mainColors.WHITE }}
            android_keyboardInputMode="adjustResize"
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            enableDismissOnClose={true}
            enableContentPanningGesture={false}
            animateOnMount={true}
        >
            <BottomSheetView style={styles.container}>
                {!permission.granted ? (
                    <Empty txt={t("cameraAccess")} />
                ) : !cameraReady ? (
                    <View style={styles.cameraLoading}>
                        <Loading size={40} />
                        <Text style={styles.cameraLoadingText}>
                            {t("loadingCamera") || "Loading camera..."}
                        </Text>
                        {isIOS && (
                            <Text style={styles.cameraHintText}>
                                If the camera doesn't appear, try closing and
                                reopening the scanner
                            </Text>
                        )}
                    </View>
                ) : (
                    <>
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
                                // Camera is ready - ensure proper state
                                console.log(
                                    "✅ Camera successfully mounted and ready on platform:",
                                    isIOS ? "iOS" : "Android"
                                );
                            }}
                            onMountError={(error) => {
                                // Camera failed to mount - close scanner with error
                                console.error("❌ Camera mount error:", error);
                                const result: QRScanResult = {
                                    success: false,
                                    error:
                                        t("cameraError") ||
                                        "Camera failed to load. Please try again.",
                                };
                                handleScanResult(result);
                            }}
                        />
                        <View style={styles.markerContainer}>
                            <StaticQRMarker
                                size={QR_MARKER_SIZE}
                                color={
                                    scanned ? mainColors.GREY : mainColors.WHITE
                                }
                            />
                        </View>
                        {scanned && !processing && (
                            <View style={styles.scanAgain}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setScanned(false);
                                        setProcessing(false);
                                    }}
                                >
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
                    </>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mainColors.BLACK,
    },
    camera: {
        flex: 1,
        width: "100%",
        height: "100%",
        // iOS-specific camera fixes
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
        color: mainColors.WHITE,
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
    },
    cameraHintText: {
        color: mainColors.WHITE,
        fontSize: "12@vs",
        fontWeight: "400",
        marginTop: "10@vs",
        textAlign: "center",
        opacity: 0.7,
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
    processingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    processingText: {
        color: mainColors.WHITE,
        fontSize: "16@vs",
        fontWeight: "500",
        marginTop: "10@vs",
    },
    markerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none", // Allow camera touch events through
    },
});
