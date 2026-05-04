import Button from "@comps/Button";
import { NS } from "@src/i18n";
import { AppText, verticalScale, fontScale, useAppThemeTokens, Stack } from "@styles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
interface ICameraPermissionProps {
  canAskAgain: boolean;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
}
export default function CameraPermission({
  canAskAgain,
  onRequestPermission,
  onOpenSettings,
}: ICameraPermissionProps) {
  const theme = useAppThemeTokens();
  const { t } = useTranslation([NS.common]);
  return (
    <Stack style={styles.container}>
      <Stack
        style={[
          styles.stage,
          {
            backgroundColor: theme.drawer,
            borderColor: theme.darkBorder,
          },
        ]}
      >
        <Stack style={[styles.iconContainer, { backgroundColor: `${theme.accent}18` }]}>
          <MaterialIcons name="photo-camera" size={36} color={theme.accent} />
        </Stack>
        <Stack style={styles.framePreview}>
          <Stack
            style={[
              styles.previewCorner,
              styles.previewCornerTopLeft,
              { borderColor: theme.accent },
            ]}
          />
          <Stack
            style={[
              styles.previewCorner,
              styles.previewCornerTopRight,
              { borderColor: theme.accent },
            ]}
          />
          <Stack
            style={[
              styles.previewCorner,
              styles.previewCornerBottomLeft,
              { borderColor: theme.accent },
            ]}
          />
          <Stack
            style={[
              styles.previewCorner,
              styles.previewCornerBottomRight,
              { borderColor: theme.accent },
            ]}
          />
        </Stack>
      </Stack>
      <AppText
        style={[styles.title]}
        weight="medium"
        align="center"
        testID={`${canAskAgain ? t("cameraAccessRequired") : t("cameraAccessDenied")}-txt`}
      >
        {canAskAgain ? t("cameraAccessRequired") : t("cameraAccessDenied")}
      </AppText>
      <AppText
        style={[styles.description, { color: theme.textSecondary }]}
        align="center"
        testID={`${canAskAgain ? t("cameraAccessRequiredHint") : t("cameraAccessDeniedHint")}-txt`}
      >
        {canAskAgain ? t("cameraAccessRequiredHint") : t("cameraAccessDeniedHint")}
      </AppText>
      <Stack style={styles.buttonContainer}>
        <Button
          txt={canAskAgain ? t("allowCameraAccess") : t("openSettings")}
          onPress={canAskAgain ? onRequestPermission : onOpenSettings}
        />
      </Stack>
    </Stack>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stage: {
    width: 190,
    height: 190,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
  },
  framePreview: {
    position: "absolute",
    width: 140,
    height: 140,
  },
  previewCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    opacity: 0.48,
  },
  previewCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 14,
  },
  previewCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 14,
  },
  previewCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 14,
  },
  previewCornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 14,
  },
  title: {
    fontSize: fontScale(24),
    marginBottom: 10,
  },
  description: {
    fontSize: fontScale(14),
    lineHeight: verticalScale(20),
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
});
