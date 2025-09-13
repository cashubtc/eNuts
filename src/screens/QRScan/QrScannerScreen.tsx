import Screen from "@comps/Screen";
import TopNav from "@nav/TopNav";
import { usePromptContext } from "@src/context/Prompt";
import { QRScannerScreenProps } from "@src/nav/navTypes";
import { CameraView, ScanningResult, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View, TouchableOpacity } from "react-native";

function parseScannerContent(content: string) {
  const normalizedContent = content.trim().toLowerCase();
  let type = "UNKNOWN";
  let parsedContent = "";
  if (normalizedContent.startsWith("lnbc")) {
    type = "LIGHTNING_INVOICE";
    parsedContent = normalizedContent;
  } else if (normalizedContent.startsWith("lightning:")) {
    type = "LIGHTNING_INVOICE";
    parsedContent = normalizedContent.slice(10);
  }
  return { type, content: parsedContent };
}

function QrScannerScreen({ route, navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { openPromptAutoClose } = usePromptContext();
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const isHandlingScanRef = useRef(false);

  useEffect(() => {
    return () => {
      isHandlingScanRef.current = false;
    };
  }, []);

  const handleCodeScanned = (result: ScanningResult) => {
    if (isHandlingScanRef.current) {
      return;
    }
    isHandlingScanRef.current = true;
    setIsScanningEnabled(false);

    const content = result.data;
    const { type, content: parsedContent } = parseScannerContent(content);
    if (type === "LIGHTNING_INVOICE") {
      openPromptAutoClose({ msg: "Is a Lightning invoice", success: true });
      return;
    }
    openPromptAutoClose({ msg: "Unsupported format", success: false });
  };

  const handleRescan = () => {
    isHandlingScanRef.current = false;
    setIsScanningEnabled(true);
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
    <View style={styles.container}>
      <View style={styles.topNavOverlay}>
        <TopNav
          screenName="QR Scanner"
          withBackBtn
          handlePress={() => navigation.goBack()}
        />
      </View>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanningEnabled ? handleCodeScanned : undefined}
        />
        {!isScanningEnabled && (
          <View style={styles.overlay}>
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
    </View>
  );
}

export default QrScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  topNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
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
});
