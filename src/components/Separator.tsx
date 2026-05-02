import { useThemeContext } from "@src/context/Theme";
import { SeparatorLine } from "@styles";
import { type StyleProp, type ViewStyle } from "react-native";

interface ISeparatorProps {
  style?: StyleProp<ViewStyle>;
  noMargin?: boolean;
}

export default function Separator({ style, noMargin }: ISeparatorProps) {
  const { color } = useThemeContext();
  return (
    <SeparatorLine
      style={[
        {
          borderBottomWidth: 1,
          borderColor: color.DARK_BORDER,
          marginBottom: noMargin ? 0 : 20,
        },
        style,
      ]}
    />
  );
}
