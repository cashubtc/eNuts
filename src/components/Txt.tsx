import { AppText, type TAppTextSize, type TAppTextTone, type TAppTextWeight } from "@styles";
import { type StyleProp, type TextStyle } from "react-native";

interface ITxtProps {
  txt: string;
  bold?: boolean;
  center?: boolean;
  error?: boolean;
  success?: boolean;
  size?: TAppTextSize;
  tone?: TAppTextTone;
  weight?: TAppTextWeight;
  styles?: StyleProp<TextStyle>[];
}

export default function Txt({
  txt,
  bold,
  center,
  error,
  success,
  size = "body",
  tone,
  weight,
  styles,
}: ITxtProps) {
  return (
    <AppText
      size={size}
      weight={weight || (bold ? "medium" : "regular")}
      align={center ? "center" : "left"}
      tone={tone || (error ? "error" : success ? "success" : "default")}
      style={styles}
      testID={`${txt}-txt`}
    >
      {txt}
    </AppText>
  );
}
