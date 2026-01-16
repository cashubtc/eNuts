import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import { ChevronRightIcon } from "./Icons";
import Loading from "./Loading";
import Separator from "./Separator";
import Txt from "./Txt";

interface IOptionProps {
  txt: string;
  hint: string;
  onPress: () => void;
  icon?: React.ReactNode;
  hasSeparator?: boolean;
  loading?: boolean;
  secondIcon?: React.ReactNode;
}

export default function Option({
  icon,
  txt,
  hint,
  onPress,
  hasSeparator,
  loading,
  secondIcon,
}: IOptionProps) {
  const { color } = useThemeContext();
  return (
    <>
      <TouchableOpacity style={globals().wrapRow} onPress={onPress} testID={`send-option-${txt}`}>
        <View style={styles.txtWrap}>
          {icon ? <View style={{ minWidth: s(40) }}>{icon}</View> : null}
          <View>
            <Txt txt={txt} bold />
            <Txt styles={[styles.targetHint, { color: color.TEXT_SECONDARY }]} txt={hint} />
          </View>
        </View>
        {loading ? (
          <Loading />
        ) : secondIcon ? (
          <View style={styles.iconWrap}>{secondIcon}</View>
        ) : (
          <ChevronRightIcon color={color.TEXT} />
        )}
      </TouchableOpacity>
      {hasSeparator && <Separator />}
    </>
  );
}

const styles = ScaledSheet.create({
  targetHint: {
    fontSize: "10@vs",
  },
  txtWrap: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "80%",
  },
  iconWrap: {
    marginRight: "-5@s",
  },
});
