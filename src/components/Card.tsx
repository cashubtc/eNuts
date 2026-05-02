import { Surface } from "@styles";
import type { ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";

interface ICardProps {
  children: ReactNode;
  variant?: "base" | "accent";
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, variant = "base", style }: ICardProps) {
  return (
    <Surface
      borderWidth={2}
      padding={20}
      borderColor={variant === "accent" ? "$accent" : "$borderColor"}
      style={[style]}
    >
      {children}
    </Surface>
  );
}
