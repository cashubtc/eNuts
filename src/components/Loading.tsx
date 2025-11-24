import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";

import AnimatedSpinner from "./AnimatedSpinner";

interface ILoadingProps {
  color?: string;
  size?: number | "small" | "large";
}

export default function Loading({ color, size }: ILoadingProps) {
  const { highlight } = useThemeContext();

  // Convert size prop to number for AnimatedSpinner
  const numericSize =
    typeof size === "number" ? size : size === "large" ? 36 : 24;

  return <AnimatedSpinner color={color || hi[highlight]} size={numericSize} />;
}
