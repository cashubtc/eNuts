import { Stack, useAppThemeTokens } from "@styles";

export default function Blank() {
  const theme = useAppThemeTokens();

  return <Stack flex={1} backgroundColor="$accent" style={{ backgroundColor: theme.accent }} />;
}
