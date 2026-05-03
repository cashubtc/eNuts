import Screen from "@comps/Screen";
import { NfcIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import NfcPaymentModal, { type NfcPaymentModalRef } from "@comps/modal/NfcPaymentModal";
import CameraPermission from "@src/screens/QRScan/components/CameraPermission";
import useScanResult from "@src/screens/QRScan/hooks/useScanResult";
import { useCashuClaimFlow } from "@comps/hooks/useCashuClaimFlow";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import type { QRScannerScreenProps } from "@src/nav/navTypes";
import { AppText, verticalScale, fontScale, useAppThemeTokens } from "@styles";
import type { PaymentCandidateKind, PaymentStringCandidate } from "@util/paymentStringParser";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { ScanningResult } from "expo-camera";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";

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
  const theme = useAppThemeTokens();
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
      style={[styles.headerAction, { borderColor: `${theme.accent}55` }]}
      testID="nfc-btn-top-nav"
    >
      <NfcIcon width={20} color={theme.accent} />
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
      <View style={[styles.cameraContainer, { backgroundColor: theme.background }]}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanningEnabled ? handleCodeScanned : undefined}
        />
        <View style={[styles.scrim, { backgroundColor: theme.cameraScrim }]} />
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
              color={theme.accent}
              textColor={theme.white}
              iconName={
                isClaimingToken
                  ? "hourglass-top"
                  : urActive
                    ? "qr-code-scanner"
                    : "center-focus-strong"
              }
            />
            <AppText style={[styles.title, { color: theme.white }]}>{t("qrScanHint")}</AppText>
            <AppText style={[styles.subtitle, { color: theme.cameraMutedText }]}>
              {t("qrScanFormats")}
            </AppText>
          </View>

          <View
            style={[
              styles.focusFrame,
              { backgroundColor: theme.cameraFrame, borderColor: `${theme.accent}66` },
            ]}
          >
            <FrameCorner position="topLeft" color={theme.accent} />
            <FrameCorner position="topRight" color={theme.accent} />
            <FrameCorner position="bottomLeft" color={theme.accent} />
            <FrameCorner position="bottomRight" color={theme.accent} />
          </View>

          <View style={styles.bottomDock}>
            {isClaimingToken && (
              <View
                style={[
                  styles.progressWrap,
                  {
                    backgroundColor: theme.cameraPanel,
                    borderColor: theme.cameraPanelBorder,
                  },
                ]}
              >
                <View style={styles.loadingState}>
                  <Loading size={24} color={theme.accent} />
                  <AppText style={[styles.progressTitle, { color: theme.white }]}>
                    {t("claiming", { ns: NS.wallet })}
                  </AppText>
                </View>
              </View>
            )}
            {!isClaimingToken && urActive && (
              <View
                style={[
                  styles.progressWrap,
                  {
                    backgroundColor: theme.cameraPanel,
                    borderColor: theme.cameraPanelBorder,
                  },
                ]}
              >
                <View style={styles.progressHeader}>
                  <AppText style={[styles.progressTitle, { color: theme.white }]}>
                    {t("receivingAnimatedQr")}
                  </AppText>
                  <AppText style={[styles.progressCount, { color: theme.accent }]}>
                    {receivedCount}/{expectedCount || "-"}
                  </AppText>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.cameraTrack }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(estimated, 1) * 100}%`, backgroundColor: theme.accent },
                    ]}
                  />
                </View>
                {urError && (
                  <AppText style={[styles.errorText, { color: theme.error }]}>{urError}</AppText>
                )}
              </View>
            )}
            {!isClaimingToken && !isScanningEnabled && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.rescanButton, { backgroundColor: theme.accent }]}
                onPress={handleRescan}
                activeOpacity={0.75}
              >
                <MaterialIcons name="refresh" size={18} color={theme.accentContrast} />
                <AppText style={[styles.rescanButtonText, { color: theme.accentContrast }]}>
                  {t("scanAgain")}
                </AppText>
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
  textColor?: string;
  iconName: ComponentProps<typeof MaterialIcons>["name"];
}

function StatusPill({ label, color, textColor = color, iconName }: IStatusPillProps) {
  const theme = useAppThemeTokens();

  return (
    <View
      style={[styles.statusPill, { backgroundColor: theme.cameraPill, borderColor: `${color}55` }]}
    >
      <MaterialIcons name={iconName} size={16} color={color} />
      <AppText style={[styles.statusText, { color: textColor }]}>{label}</AppText>
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
    marginBottom: 18,
  },
  statusText: {
    fontSize: fontScale(12),
    fontWeight: "600",
  },
  title: {
    fontSize: fontScale(24),
    lineHeight: verticalScale(30),
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontScale(13),
    lineHeight: verticalScale(19),
    textAlign: "center",
    marginTop: 8,
  },
  focusFrame: {
    width: 268,
    height: 268,
    borderRadius: 34,
    borderWidth: 1,
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
    borderWidth: 1,
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
    fontSize: fontScale(14),
    fontWeight: "600",
  },
  progressCount: {
    fontSize: fontScale(13),
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 999,
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
    fontSize: fontScale(15),
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: fontScale(12),
  },
});
