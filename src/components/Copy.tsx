import { useThemeContext } from "@src/context/Theme";
import { mainColors } from "@styles";
import { TouchableOpacity } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import useCopy from "./hooks/Copy";
import { CheckmarkIcon, CopyIcon } from "./Icons";

export default function Copy({ txt }: { txt: string }) {
  const { color } = useThemeContext();
  const { copied, copy } = useCopy();

  return (
    <TouchableOpacity style={styles.copyIconWrap} onPress={() => void copy(txt)} disabled={copied}>
      {copied ? (
        <CheckmarkIcon width={s(16)} height={s(16)} color={mainColors.VALID} />
      ) : (
        <CopyIcon width={s(18)} height={s(18)} color={color.TEXT_SECONDARY} />
      )}
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  copyIconWrap: {
    paddingHorizontal: "10@s",
    paddingVertical: "5@vs",
  },
});
