import { useThemeContext } from "@src/context/Theme";
import { Surface, highlight as hi } from "@styles";
import type { ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";

interface ICardProps {
  children: ReactNode;
  variant?: "base" | "accent";
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, variant = "base", style }: ICardProps) {
  const { color, highlight } = useThemeContext();

  return (
    <Surface
      style={[
        {
          borderWidth: 2,
          padding: 20,
        },
        {
          backgroundColor: color.DRAWER,
          borderColor: variant === "accent" ? hi[highlight] : color.BORDER,
        },
        style,
      ]}
    >
      {children}
    </Surface>
  );
}
