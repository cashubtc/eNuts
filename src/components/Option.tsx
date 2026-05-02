import { useThemeContext } from "@src/context/Theme";
import { Stack, globals } from "@styles";
import { TouchableOpacity } from "react-native";

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
        <Stack flexDirection="row" alignItems="center" maxWidth="80%">
          {icon ? <Stack style={{ minWidth: 40 }}>{icon}</Stack> : null}
          <Stack>
            <Txt txt={txt} bold />
            <Txt styles={[{ fontSize: 10, color: color.TEXT_SECONDARY }]} txt={hint} />
          </Stack>
        </Stack>
        {loading ? (
          <Loading />
        ) : secondIcon ? (
          <Stack marginRight={-5}>{secondIcon}</Stack>
        ) : (
          <ChevronRightIcon color={color.TEXT} />
        )}
      </TouchableOpacity>
      {hasSeparator && <Separator />}
    </>
  );
}
