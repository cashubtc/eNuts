import Button from "@comps/Button";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi } from "@styles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ScaledSheet, s } from "react-native-size-matters";

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
          <MaterialIcons name="photo-camera" size={s(36)} color={hi[highlight]} />
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

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "24@s",
  },
  stage: {
    width: "190@s",
    height: "190@s",
    borderRadius: "42@s",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "28@vs",
  },
  iconContainer: {
    width: "78@s",
    height: "78@s",
    borderRadius: "39@s",
    alignItems: "center",
    justifyContent: "center",
  },
  framePreview: {
    position: "absolute",
    width: "140@s",
    height: "140@s",
  },
  previewCorner: {
    position: "absolute",
    width: "28@s",
    height: "28@s",
    opacity: 0.48,
  },
  previewCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: "3@s",
    borderLeftWidth: "3@s",
    borderTopLeftRadius: "14@s",
  },
  previewCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: "3@s",
    borderRightWidth: "3@s",
    borderTopRightRadius: "14@s",
  },
  previewCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: "3@s",
    borderLeftWidth: "3@s",
    borderBottomLeftRadius: "14@s",
  },
  previewCornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: "3@s",
    borderBottomWidth: "3@s",
    borderBottomRightRadius: "14@s",
  },
  title: {
    fontSize: "24@vs",
    marginBottom: "10@vs",
  },
  description: {
    fontSize: "14@vs",
    lineHeight: "20@vs",
    marginBottom: "30@vs",
    paddingHorizontal: "16@s",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: "20@s",
  },
});
