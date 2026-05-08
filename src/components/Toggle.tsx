import { isIOS } from "@consts";
import { useAppThemeTokens } from "@styles";
import { Switch } from "react-native";

interface IToggleProps {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ value, onChange, disabled }: IToggleProps) {
  const theme = useAppThemeTokens();
  return (
    <Switch
      trackColor={{ false: theme.border, true: theme.accent }}
      thumbColor={theme.text}
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
