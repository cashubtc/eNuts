import Screen from "@comps/Screen";
import Progress from "@comps/Progress";
import { useUrDecoder } from "@comps/hooks/useUrDecoder";
import TopNav from "@nav/TopNav";
import { usePromptContext } from "@src/context/Prompt";
import { QRScannerScreenProps } from "@src/nav/navTypes";
import { CameraView, ScanningResult, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Button, StyleSheet, Text, View, TouchableOpacity } from "react-native";

function parseScannerContent(content: string) {
  const trimmed = content.trim();
  const normalized = trimmed.toLowerCase();
  let type = "UNKNOWN";
  let parsedContent = "";
  if (normalized.startsWith("lnbc")) {
    type = "LIGHTNING_INVOICE";
    parsedContent = trimmed;
  } else if (normalized.startsWith("lightning:")) {
    type = "LIGHTNING_INVOICE";
    parsedContent = trimmed.slice(10);
  } else if (
    normalized.startsWith("cashua") ||
    normalized.startsWith("cashub")
  ) {
    type = "CASHU_TOKEN";
    parsedContent = trimmed;
  } else if (normalized.startsWith("cashu:")) {
    type = "CASHU_TOKEN";
    parsedContent = trimmed.slice(6);
  }
  return { type, content: parsedContent };
}

function QrScannerScreen({ route, navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { openPromptAutoClose } = usePromptContext();
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const isHandlingScanRef = useRef(false);

  const {
    addPart,
    reset: resetUr,
    active: urActive,
    complete: urComplete,
    estimated,
    expectedCount,
    receivedCount,
    decodedString,
    error: urError,
  } = useUrDecoder({ allowedTypes: ["bytes"] });

  const urHandledRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // on focus
      isHandlingScanRef.current = false;
      urHandledRef.current = false;
      setIsScanningEnabled(true);
      resetUr();
      return () => {
        // on blur
        resetUr();
        isHandlingScanRef.current = false;
        urHandledRef.current = false;
        setIsScanningEnabled(true);
      };
    }, [resetUr])
  );

  useEffect(() => {
    if (!urComplete || !decodedString || urHandledRef.current) return;
    urHandledRef.current = true;
    isHandlingScanRef.current = true;
    setIsScanningEnabled(false);
    let content = decodedString;
    const { type, content: parsedContent } = parseScannerContent(content);
    if (type === "LIGHTNING_INVOICE") {
      navigation.replace("MeltInput", { invoice: parsedContent });
      return;
    }
    openPromptAutoClose({ msg: "Unsupported format", success: false });
  }, [urComplete, decodedString, navigation, openPromptAutoClose]);

  const handleCodeScanned = (result: ScanningResult) => {
    if (isHandlingScanRef.current) {
      return;
    }
    let content = result.data;
    if (content.toLowerCase().startsWith("ur:")) {
      const { accepted } = addPart(content);
      if (accepted) {
        // Keep scanning to accumulate further parts
        return;
      }
      // If not accepted, fall through to normal parsing
    }
    isHandlingScanRef.current = true;
    setIsScanningEnabled(false);

    const { type, content: parsedContent } = parseScannerContent(content);
    if (type === "LIGHTNING_INVOICE") {
      navigation.replace("MeltInput", { invoice: parsedContent });
      return;
    }
    if (type === "CASHU_TOKEN") {
      //TODO: handle cashu token
      return;
    }
    openPromptAutoClose({ msg: "Unsupported format", success: false });
  };

  const handleRescan = () => {
    isHandlingScanRef.current = false;
    setIsScanningEnabled(true);
    resetUr();
    urHandledRef.current = false;
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
