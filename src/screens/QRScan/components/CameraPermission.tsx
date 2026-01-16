import Button from "@comps/Button";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { View } from "react-native";
import { ScaledSheet, s } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { highlight as hi } from "@styles";

interface CameraPermissionProps {
  canAskAgain: boolean;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
}

export default function CameraPermission({
  canAskAgain,
  onRequestPermission,
  onOpenSettings,
}: CameraPermissionProps) {
  const { color, highlight } = useThemeContext();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color.DRAWER }]}>
        <MaterialIcons name="camera-alt" size={s(48)} color={hi[highlight]} />
      </View>
      <Txt
        txt={canAskAgain ? "Camera Access Required" : "Camera Access Denied"}
        bold
        center
        styles={[styles.title]}
      />
      <Txt
        txt={
          canAskAgain
            ? "We need camera access to scan QR codes for payments and tokens."
            : "Camera access was denied. Please enable it in your device settings to scan QR codes."
        }
        center
        styles={[styles.description, { color: color.TEXT_SECONDARY }]}
      />
      <View style={styles.buttonContainer}>
        <Button
          txt={canAskAgain ? "Allow Camera Access" : "Open Settings"}
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
  iconContainer: {
    width: "100@s",
    height: "100@s",
    borderRadius: "50@s",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24@vs",
  },
  title: {
    fontSize: "20@vs",
    marginBottom: "12@vs",
  },
  description: {
    fontSize: "14@vs",
    lineHeight: "20@vs",
    marginBottom: "32@vs",
    paddingHorizontal: "16@s",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: "20@s",
  },
});
