import { useAppThemeTokens } from "@styles";
import React from "react";
import { View, StyleSheet } from "react-native";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";

interface MetadataItemProps {
  text: string;
  hasSeparator?: boolean;
}

export default function MetadataItem({ text, hasSeparator }: MetadataItemProps) {
  const theme = useAppThemeTokens();
  return (
    <>
      <View style={[styles.metadataItem, { paddingBottom: 15 }]}>
        <Txt txt={text} styles={[styles.metadataText, { color: theme.text }]} />
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
    fontSize: 14,
    lineHeight: 20,
    flexWrap: "wrap",
    flexShrink: 1,
    opacity: 0.8,
  },
  separator: {
    marginBottom: 15,
  },
});
