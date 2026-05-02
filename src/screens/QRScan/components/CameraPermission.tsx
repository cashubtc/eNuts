import Button from "@comps/Button";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi } from "@styles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";

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
  const { color, highlight } = useThemeContext();
  const { t } = useTranslation([NS.common]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.stage,
          {
            backgroundColor: color.DRAWER,
            borderColor: color.DARK_BORDER,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${hi[highlight]}18` }]}>
          <MaterialIcons name="photo-camera" size={36} color={hi[highlight]} />
        </View>
        <View style={styles.framePreview}>
          <View
            style={[
              styles.previewCorner,
              styles.previewCornerTopLeft,
              { borderColor: hi[highlight] },
            ]}
          />
          <View
            style={[
              styles.previewCorner,
              styles.previewCornerTopRight,
              { borderColor: hi[highlight] },
            ]}
          />
          <View
            style={[
              styles.previewCorner,
              styles.previewCornerBottomLeft,
              { borderColor: hi[highlight] },
            ]}
          />
          <View
            style={[
              styles.previewCorner,
              styles.previewCornerBottomRight,
              { borderColor: hi[highlight] },
            ]}
          />
        </View>
      </View>
      <Txt
        txt={canAskAgain ? t("cameraAccessRequired") : t("cameraAccessDenied")}
        bold
        center
        styles={[styles.title]}
      />
      <Txt
        txt={canAskAgain ? t("cameraAccessRequiredHint") : t("cameraAccessDeniedHint")}
        center
        styles={[styles.description, { color: color.TEXT_SECONDARY }]}
      />
      <View style={styles.buttonContainer}>
        <Button
          txt={canAskAgain ? t("allowCameraAccess") : t("openSettings")}
          onPress={canAskAgain ? onRequestPermission : onOpenSettings}
        />
      </View>
    </View>
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
    fontSize: 24,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
});
