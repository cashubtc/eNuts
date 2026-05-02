import { AppText } from "@styles";
import { type StyleProp, type TextStyle } from "react-native";

interface ITxtProps {
  txt: string;
  bold?: boolean;
  center?: boolean;
  error?: boolean;
  success?: boolean;
  styles?: StyleProp<TextStyle>[];
}

export default function Txt({ txt, bold, center, error, success, styles }: ITxtProps) {
  return (
    <AppText
      weight={bold ? "medium" : "regular"}
      align={center ? "center" : "left"}
      tone={error ? "error" : success ? "success" : "default"}
      style={styles}
      testID={`${txt}-txt`}
    >
      {txt}
    </AppText>
  );
}
