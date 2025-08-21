import React from "react";
import { View } from "react-native";
import { vs, ScaledSheet } from "react-native-size-matters";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";

interface MetadataItemProps {
  text: string;
  hasSeparator?: boolean;
}

export default function MetadataItem({
  text,
  hasSeparator,
}: MetadataItemProps) {
  const { color } = useThemeContext();
  return (
    <>
      <View style={[styles.metadataItem, { paddingBottom: vs(15) }]}>
        <Txt txt={text} styles={[styles.metadataText, { color: color.TEXT }]} />
      </View>
      {hasSeparator && <Separator style={[styles.separator]} />}
    </>
  );
}

const styles = ScaledSheet.create({
  metadataItem: {
    paddingHorizontal: "20@s",
    marginBottom: "5@vs",
  },
  metadataText: {
    fontSize: "14@vs",
    lineHeight: "20@vs",
    flexWrap: "wrap",
    flexShrink: 1,
    opacity: 0.8,
  },
  separator: {
    marginBottom: "15@vs",
  },
});
