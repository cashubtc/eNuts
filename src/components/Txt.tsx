import { useThemeContext } from "@src/context/Theme";
import { AppText, mainColors } from "@styles";
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
  const { color } = useThemeContext();
  return (
    <AppText
      weight={bold ? "medium" : "regular"}
      align={center ? "center" : "left"}
      style={[
        {
          color: error ? mainColors.ERROR : success ? mainColors.VALID : color.TEXT,
        },
        ...(styles || []),
      ]}
      testID={`${txt}-txt`}
    >
      {txt}
    </AppText>
  );
}
