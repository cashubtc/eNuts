import { useThemeContext } from "@src/context/Theme";
import { highlight as hi } from "@styles";
import { StyleSheet, View } from "react-native";

import Txt from "./Txt";

interface IProgressProps {
  progress: number;
  withIndicator?: boolean;
  contactsCount?: number;
  doneCount?: number;
}

export default function Progress({
  progress,
  withIndicator,
  contactsCount,
  doneCount,
}: IProgressProps) {
  const { color, highlight } = useThemeContext();
  return (
    <>
      <View style={[styles.progress, { backgroundColor: color.INPUT_BG }]}>
        <View
          style={[styles.bar, { width: `${progress * 100}%`, backgroundColor: hi[highlight] }]}
        />
      </View>
      {withIndicator && (
        <Txt
          txt={`${progress * 100}% - ${doneCount}/${contactsCount}`}
          styles={[styles.indicator]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  progress: {
    width: "100%",
    height: 5,
    marginBottom: 20,
  },
  bar: {
    height: 5,
  },
  indicator: {
    textAlign: "center",
    marginBottom: 20,
  },
});
