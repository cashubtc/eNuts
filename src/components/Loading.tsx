import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";
import { ActivityIndicator, Image } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

interface ILoadingProps {
    color?: string;
    size?: number | "small" | "large";
}

export default function Loading({ color, size }: ILoadingProps) {
    const { highlight } = useThemeContext();
    return <ActivityIndicator size={size} color={color || hi[highlight]} />;
}
