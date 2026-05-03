import { fontScale, Stack, globals, useAppThemeTokens } from "@styles";
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
  const theme = useAppThemeTokens();
  return (
    <>
      <TouchableOpacity style={globals().wrapRow} onPress={onPress} testID={`send-option-${txt}`}>
        <Stack flexDirection="row" alignItems="center" maxWidth="80%">
          {icon ? <Stack style={{ minWidth: 40 }}>{icon}</Stack> : null}
          <Stack>
            <Txt txt={txt} bold />
            <Txt styles={[{ fontSize: fontScale(10), color: theme.textSecondary }]} txt={hint} />
          </Stack>
        </Stack>
        {loading ? (
          <Loading />
        ) : secondIcon ? (
          <Stack marginRight={-5}>{secondIcon}</Stack>
        ) : (
          <ChevronRightIcon color={theme.text} />
        )}
      </TouchableOpacity>
      {hasSeparator && <Separator />}
    </>
  );
}
