import { SeparatorLine } from "@styles";
import { type StyleProp, type ViewStyle } from "react-native";

interface ISeparatorProps {
  style?: StyleProp<ViewStyle>;
  noMargin?: boolean;
}

export default function Separator({ style, noMargin }: ISeparatorProps) {
  return (
    <SeparatorLine
      style={[
        {
          borderBottomWidth: 1,
          marginBottom: noMargin ? 0 : 20,
        },
        style,
      ]}
    />
  );
}
