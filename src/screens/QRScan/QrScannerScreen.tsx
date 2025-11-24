import Screen from "@comps/Screen";
import Progress from "@comps/Progress";
import useScanResult from "@src/screens/QRScan/hooks/useScanResult";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";
import { usePromptContext } from "@src/context/Prompt";
import { QRScannerScreenProps } from "@src/nav/navTypes";
import { CameraView, ScanningResult, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Button, StyleSheet, Text, View, TouchableOpacity } from "react-native";

function QrScannerScreen({ route, navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { openPromptAutoClose } = usePromptContext();
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const isHandlingScanRef = useRef(false);

  const {
    onScan,
    reset,
    active: urActive,
    complete,
    estimated,
    expectedCount,
    receivedCount,
    error: urError,
    result: scanResult,
  } = useScanResult();

  const { claimFromTokenString } = useCashuClaimFlow();

  useFocusEffect(
    useCallback(() => {
      // on focus
      isHandlingScanRef.current = false;
      setIsScanningEnabled(true);
      reset();
      return () => {
        // on blur
        reset();
        isHandlingScanRef.current = false;
        setIsScanningEnabled(true);
      };
    }, [reset])
  );

  useEffect(() => {
    if (!complete || !scanResult || isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;
    setIsScanningEnabled(false);
    const { type, content: parsedContent } = scanResult;
    if (type === "LIGHTNING_INVOICE") {
      navigation.replace("MeltInput", { invoice: parsedContent });
      return;
    }
    if (type === "CASHU_TOKEN") {
      (async () => {
        const result = await claimFromTokenString(parsedContent);
        if (result === "success") {
          navigation.replace("success", {
            isClaim: true,
            isScanned: true,
          });
        }
      })();
      return;
    }
    openPromptAutoClose({ msg: "Unsupported format", success: false });
  }, [
    complete,
    scanResult,
    navigation,
    openPromptAutoClose,
    claimFromTokenString,
  ]);

  const handleCodeScanned = (result: ScanningResult) => {
    if (isHandlingScanRef.current) {
      return;
    }
    onScan(result.data);
  };

  const handleRescan = () => {
    isHandlingScanRef.current = false;
    setIsScanningEnabled(true);
    reset();
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <Screen
        screenName="QR Scanner"
        withBackBtn
        handlePress={() => navigation.goBack()}
      >
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </Screen>
    );
  }

  return (
    <Screen
      screenName="QR Scanner"
      withBackBtn
      handlePress={() => navigation.goBack()}
      withPadding={false}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanningEnabled ? handleCodeScanned : undefined}
        />
        {(!isScanningEnabled || urActive) && (
          <View style={styles.overlay}>
            {urActive && (
              <View style={styles.progressBox}>
                <Text style={styles.progressTitle}>Receiving animated QR…</Text>
                <Progress
                  progress={estimated}
                  withIndicator
                  contactsCount={expectedCount || undefined}
                  doneCount={receivedCount || undefined}
                />
                {urError && <Text style={styles.errorText}>{urError}</Text>}
              </View>
            )}
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={handleRescan}
              activeOpacity={0.8}
            >
              <Text style={styles.rescanButtonText}>Rescan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

export default QrScannerScreen;

const styles = StyleSheet.create({
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  progressBox: {
    width: "90%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    marginBottom: 12,
  },
  progressTitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "600",
  },
  rescanButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ff8a8a",
    marginTop: 8,
    textAlign: "center",
  },
});
