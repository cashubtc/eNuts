import { isIOS } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";
import { Switch } from "react-native";

interface IToggleProps {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ value, onChange, disabled }: IToggleProps) {
  const { color, highlight } = useThemeContext();
  return (
    <Switch
      trackColor={{ false: color.BORDER, true: hi[highlight] }}
      thumbColor={color.TEXT}
      onValueChange={onChange}
      value={value}
      style={[
        {
          marginVertical: -10,
          transform: [{ scaleX: isIOS ? 0.6 : 1 }, { scaleY: isIOS ? 0.6 : 1 }],
        },
        disabled && { opacity: 0.5 },
      ]}
      disabled={disabled}
    />
  );
}
