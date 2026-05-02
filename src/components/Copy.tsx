import { useAppThemeTokens } from "@styles";
import { TouchableOpacity } from "react-native";

import useCopy from "./hooks/Copy";
import { CheckmarkIcon, CopyIcon } from "./Icons";

export default function Copy({ txt }: { txt: string }) {
  const theme = useAppThemeTokens();
  const { copied, copy } = useCopy();

  return (
    <TouchableOpacity
      style={{ paddingHorizontal: 10, paddingVertical: 5 }}
      onPress={() => void copy(txt)}
      disabled={copied}
    >
      {copied ? (
        <CheckmarkIcon width={16} height={16} color={theme.valid} />
      ) : (
        <CopyIcon width={18} height={18} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );
}
