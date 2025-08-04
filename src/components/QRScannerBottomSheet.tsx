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
const CAMERA_READY_DELAY = 300;
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
        const result = await requestPermission();
        if (!result.granted) {
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
            // Small delay after permission grant to ensure camera is ready
            setTimeout(() => setCameraReady(true), CAMERA_READY_DELAY);
        }
    }, [requestPermission, t, closeScanner]);

    // Request camera permissions when modal opens
    useEffect(() => {
        if (!state.visible) return;

        if (!permission?.granted && !permissionRequested) {
            setPermissionRequested(true);
            void requestCameraPermission();
        } else if (permission?.granted) {
            // Permissions already granted - activate camera immediately
            setCameraReady(true);
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
                    </View>
                ) : (
                    <>
                        <CameraView
                            style={styles.camera}
                            onBarcodeScanned={
                                scanned ? undefined : handleBarCodeScanned
                            }
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                            onCameraReady={() => {
                                // Camera is ready - could add analytics here if needed
                            }}
                            onMountError={(error) => {
                                // Camera failed to mount - close scanner with error
                                const result: QRScanResult = {
                                    success: false,
                                    error:
                                        t("cameraError") ||
                                        "Camera failed to load. Please try again.",
                                };
                                handleScanResult(result);
                            }}
                        />
                        <StaticQRMarker
                            size={QR_MARKER_SIZE}
                            color={scanned ? mainColors.GREY : mainColors.WHITE}
                        />
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
        backgroundColor: mainColors.BLACK,
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
});
