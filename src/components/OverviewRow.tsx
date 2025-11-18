import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { globalStyles as globals } from "@src/styles/globals";
import { View } from "react-native";

export function OverviewRow({ txt1, txt2 }: { txt1: string; txt2: string }) {
  return (
    <>
      <View style={globals().wrapRow}>
        <Txt txt={txt1} bold />
        <Txt txt={txt2} />
      </View>
      <Separator />
    </>
  );
}
