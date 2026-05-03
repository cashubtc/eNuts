import { AppText, verticalScale, fontScale, useAppThemeTokens } from "@styles";
import React from "react";
import { View, StyleSheet } from "react-native";
import Separator from "@comps/Separator";
interface MetadataItemProps {
  text: string;
  hasSeparator?: boolean;
}
export default function MetadataItem({ text, hasSeparator }: MetadataItemProps) {
  const theme = useAppThemeTokens();
  return (
    <>
      <View style={[styles.metadataItem, { paddingBottom: 15 }]}>
        <AppText style={[styles.metadataText, { color: theme.text }]} testID={`${text}-txt`}>
          {text}
        </AppText>
      </View>
      {hasSeparator && <Separator style={[styles.separator]} />}
    </>
  );
}
const styles = StyleSheet.create({
  metadataItem: {
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  metadataText: {
    fontSize: fontScale(14),
    lineHeight: verticalScale(20),
    flexWrap: "wrap",
    flexShrink: 1,
    opacity: 0.8,
  },
  separator: {
    marginBottom: 15,
  },
});
