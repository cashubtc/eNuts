import { useAppThemeTokens } from "@styles";
import { View } from "react-native";

export default function Blank() {
  const theme = useAppThemeTokens();

  return <View style={{ flex: 1, backgroundColor: theme.accent }} />;
}
