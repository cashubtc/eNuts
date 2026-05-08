import { useThemeContext } from "@src/context/Theme";
import { Stack } from "@styles";
import { Image, type ImageStyle, type StyleProp, StyleSheet } from "react-native";

interface ILogoProps {
  size: number;
  success?: boolean;
  style?: StyleProp<ImageStyle>;
}

export default function Logo({ size, success, style }: ILogoProps) {
  const { highlight, activeTheme } = useThemeContext();

  const src = success
    ? require("@assets/icon_transparent_success.png")
    : activeTheme === "dark" &&
        (highlight === "Zap" || highlight === "Azyre" || highlight === "Rosy")
      ? require("@assets/icon_transparent_dark.png")
      : require("@assets/icon_transparent.png");
  return (
    <Stack style={styles.imgWrap}>
      <Image style={[styles.img, { height: size }, style]} source={src} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  imgWrap: {
    alignItems: "center",
  },
  img: {
    resizeMode: "contain",
  },
});
