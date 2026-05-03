import { AppText } from "@styles";
import Separator from "@comps/Separator";
import { globalStyles as globals } from "@src/styles/globals";
import { View } from "react-native";
export function OverviewRow({ txt1, txt2 }: { txt1: string; txt2: string }) {
  return (
    <>
      <View style={globals().wrapRow}>
        <AppText weight="medium" testID={`${txt1}-txt`}>
          {txt1}
        </AppText>
        <AppText testID={`${txt2}-txt`}>{txt2}</AppText>
      </View>
      <Separator />
    </>
  );
}
