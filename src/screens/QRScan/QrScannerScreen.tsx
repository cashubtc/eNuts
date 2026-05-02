import Screen from "@comps/Screen";
import { NfcIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import NfcPaymentModal, { type NfcPaymentModalRef } from "@comps/modal/NfcPaymentModal";
import CameraPermission from "@src/screens/QRScan/components/CameraPermission";
import useScanResult from "@src/screens/QRScan/hooks/useScanResult";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import type { QRScannerScreenProps } from "@src/nav/navTypes";
import { highlight as hi, mainColors } from "@styles";
import { getColor } from "@styles/colors";
import type { PaymentCandidateKind, PaymentStringCandidate } from "@util/paymentStringParser";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { ScanningResult } from "expo-camera";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const QR_CANDIDATE_PRIORITY: PaymentCandidateKind[] = [
  "cashuToken",
  "lightningInvoice",
  "lightningAddress",
  "lnurl",
  "cashuPaymentRequest",
  "bitcoinAddress",
];

function selectQrCandidate(candidates: PaymentStringCandidate[]) {
  return QR_CANDIDATE_PRIORITY.map((kind) =>
    candidates.find((candidate) => candidate.kind === kind),
  ).find((candidate): candidate is PaymentStringCandidate => Boolean(candidate));
}

function QrScannerScreen({ navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { t } = useTranslation([NS.common, NS.wallet]);
  const { color, highlight } = useThemeContext();
  const { openPromptAutoClose } = usePromptContext();
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const [isClaimingScannedToken, setIsClaimingScannedToken] = useState(false);
  const isHandlingScanRef = useRef(false);
  const isScreenActiveRef = useRef(false);
  const nfcModalRef = useRef<NfcPaymentModalRef>(null);

  const {
    onScan,
    reset,
    active: urActive,
    complete,
    estimated,
    expectedCount,
    receivedCount,
    error: urError,
    candidates,
  } = useScanResult();

  const { claimFromTokenString, isReceiving } = useCashuClaimFlow();
  const isClaimingToken = isClaimingScannedToken || isReceiving;

  useFocusEffect(
    useCallback(() => {
      // on focus
      isScreenActiveRef.current = true;
      isHandlingScanRef.current = false;
      setIsClaimingScannedToken(false);
      setIsScanningEnabled(true);
      reset();
      return () => {
        // on blur
        isScreenActiveRef.current = false;
        reset();
        isHandlingScanRef.current = false;
        setIsClaimingScannedToken(false);
        setIsScanningEnabled(true);
      };
    }, [reset]),
  );

  useEffect(() => {
    if (!complete || !candidates || isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;
    setIsScanningEnabled(false);
    const selectedCandidate = selectQrCandidate(candidates);
    if (!selectedCandidate) {
      openPromptAutoClose({ msg: t("unsupportedFormat"), success: false });
      return;
    }

    if (
      selectedCandidate.kind === "lightningInvoice" ||
      selectedCandidate.kind === "lightningAddress" ||
      selectedCandidate.kind === "lnurl"
    ) {
      navigation.replace("MeltInput", { invoice: selectedCandidate.value });
      return;
    }

    if (selectedCandidate.kind === "cashuToken") {
      setIsClaimingScannedToken(true);
      (async () => {
        try {
          const result = await claimFromTokenString(selectedCandidate.value);
          if (result.status === "success") {
            navigation.replace("successScreen", {
              type: "claim",
              mint: result.token.mint,
              amount: result.amount,
            });
          }
        } finally {
          if (isScreenActiveRef.current) {
            setIsClaimingScannedToken(false);
          }
        }
      })();
      return;
    }

    if (selectedCandidate.kind === "cashuPaymentRequest") {
      openPromptAutoClose({
        msg: t("cashuPaymentRequestQrUnsupported"),
        success: false,
      });
      return;
    }

    if (selectedCandidate.kind === "bitcoinAddress") {
      openPromptAutoClose({ msg: t("bitcoinAddressPaymentsUnsupported"), success: false });
      return;
    }
  }, [complete, candidates, navigation, openPromptAutoClose, claimFromTokenString, t]);

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

  const handleNfcPress = () => {
    nfcModalRef.current?.open();
  };

  const nfcHeaderAction = (
    <TouchableOpacity
      accessibilityLabel={t("nfcPayment", {
        ns: NS.wallet,
        defaultValue: "NFC Payment",
      })}
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={handleNfcPress}
      style={[styles.headerAction, { borderColor: `${hi[highlight]}55` }]}
      testID="nfc-btn-top-nav"
    >
      <NfcIcon width={20} color={hi[highlight]} />
    </TouchableOpacity>
  );

  const nfcPaymentModal = (
    <NfcPaymentModal
      ref={nfcModalRef}
      onSuccess={(result) => {
        openPromptAutoClose({
          msg: result.amount
            ? `Sent ${result.amount.toLocaleString()} sats via NFC!`
            : "NFC payment sent successfully!",
          success: true,
        });
      }}
      onError={(result) => {
        openPromptAutoClose({
          msg: result.error || "NFC payment failed",
          success: false,
        });
      }}
      onPaymentHandoff={(handoff) => {
        navigation.navigate("MeltInput", { invoice: handoff.value });
      }}
    />
  );

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <Screen
        screenName={t("scanQR")}
        withBackBtn
        handlePress={() => navigation.goBack()}
        rightAction={nfcHeaderAction}
        withBottomInset={false}
      >
        <>
          <CameraPermission
            canAskAgain={permission.canAskAgain}
            onRequestPermission={requestPermission}
            onOpenSettings={() => Linking.openSettings()}
          />
          {nfcPaymentModal}
        </>
      </Screen>
    );
  }

  return (
    <Screen
      screenName={t("scanQR")}
      withBackBtn
      handlePress={() => navigation.goBack()}
      rightAction={nfcHeaderAction}
      withPadding={false}
      withBottomInset={false}
    >
      <View style={[styles.cameraContainer, { backgroundColor: color.BACKGROUND }]}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanningEnabled ? handleCodeScanned : undefined}
        />
        <View style={styles.scrim} />
        <View style={styles.scanSurface}>
          <View style={styles.headerCopy}>
            <StatusPill
              label={
                isClaimingToken
                  ? t("claiming", { ns: NS.wallet })
                  : urActive
                    ? t("animatedQrProgress")
                    : isScanningEnabled
                      ? t("qrScanReady")
                      : t("qrScanPaused")
              }
              color={hi[highlight]}
              iconName={
                isClaimingToken
                  ? "hourglass-top"
                  : urActive
                    ? "qr-code-scanner"
                    : "center-focus-strong"
              }
            />
            <Text style={styles.title}>{t("qrScanHint")}</Text>
            <Text style={styles.subtitle}>{t("qrScanFormats")}</Text>
          </View>

          <View style={[styles.focusFrame, { borderColor: `${hi[highlight]}66` }]}>
            <FrameCorner position="topLeft" color={hi[highlight]} />
            <FrameCorner position="topRight" color={hi[highlight]} />
            <FrameCorner position="bottomLeft" color={hi[highlight]} />
            <FrameCorner position="bottomRight" color={hi[highlight]} />
          </View>

          <View style={styles.bottomDock}>
            {isClaimingToken && (
              <View style={styles.progressWrap}>
                <View style={styles.loadingState}>
                  <Loading size={24} color={hi[highlight]} />
                  <Text style={styles.progressTitle}>{t("claiming", { ns: NS.wallet })}</Text>
                </View>
              </View>
            )}
            {!isClaimingToken && urActive && (
              <View style={styles.progressWrap}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>{t("receivingAnimatedQr")}</Text>
                  <Text style={[styles.progressCount, { color: hi[highlight] }]}>
                    {receivedCount}/{expectedCount || "-"}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(estimated, 1) * 100}%`, backgroundColor: hi[highlight] },
                    ]}
                  />
                </View>
                {urError && <Text style={styles.errorText}>{urError}</Text>}
              </View>
            )}
            {!isClaimingToken && !isScanningEnabled && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.rescanButton, { backgroundColor: hi[highlight] }]}
                onPress={handleRescan}
                activeOpacity={0.75}
              >
                <MaterialIcons name="refresh" size={18} color={getColor(highlight, color)} />
                <Text style={[styles.rescanButtonText, { color: getColor(highlight, color) }]}>
                  {t("scanAgain")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {nfcPaymentModal}
      </View>
    </Screen>
  );
}

export default QrScannerScreen;

interface IStatusPillProps {
  label: string;
  color: string;
  iconName: ComponentProps<typeof MaterialIcons>["name"];
}

function StatusPill({ label, color, iconName }: IStatusPillProps) {
  return (
    <View style={[styles.statusPill, { borderColor: `${color}55` }]}>
      <MaterialIcons name={iconName} size={16} color={color} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

type TFrameCornerPosition = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

interface IFrameCornerProps {
  position: TFrameCornerPosition;
  color: string;
}

function FrameCorner({ position, color }: IFrameCornerProps) {
  const positionStyle = {
    topLeft: styles.cornerTopLeft,
    topRight: styles.cornerTopRight,
    bottomLeft: styles.cornerBottomLeft,
    bottomRight: styles.cornerBottomRight,
  }[position];

  return (
    <View style={[styles.corner, positionStyle]}>
      <View style={[styles.cornerHorizontal, { backgroundColor: color }]} />
      <View style={[styles.cornerVertical, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraContainer: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  scanSurface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 26,
  },
  headerCopy: {
    width: "100%",
    alignItems: "center",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 0, 0, 0.36)",
    marginBottom: 18,
  },
  statusText: {
    color: mainColors.WHITE,
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: mainColors.WHITE,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(250, 250, 250, 0.72)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  focusFrame: {
    width: 268,
    height: 268,
    borderRadius: 34,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 56,
    height: 56,
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
  },
  cornerTopRight: {
    top: 12,
    right: 12,
    transform: [{ rotate: "90deg" }],
  },
  cornerBottomLeft: {
    bottom: 12,
    left: 12,
    transform: [{ rotate: "-90deg" }],
  },
  cornerBottomRight: {
    right: 12,
    bottom: 12,
    transform: [{ rotate: "180deg" }],
  },
  cornerHorizontal: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  cornerVertical: {
    width: 4,
    height: 44,
    borderRadius: 999,
    marginTop: -4,
  },
  bottomDock: {
    width: "100%",
    minHeight: 92,
    justifyContent: "flex-end",
  },
  progressWrap: {
    width: "100%",
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 12,
    minHeight: 40,
  },
  progressTitle: {
    color: mainColors.WHITE,
    fontSize: 14,
    fontWeight: "600",
  },
  progressCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  rescanButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
  },
  rescanButtonText: {
    color: mainColors.WHITE,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: mainColors.ERROR,
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
  },
});
