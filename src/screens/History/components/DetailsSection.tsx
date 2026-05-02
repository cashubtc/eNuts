import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { View, StyleSheet } from "react-native";
import { ReactNode } from "react";

type DetailsSectionProps = {
  children: ReactNode;
};

export function DetailsSection({ children }: DetailsSectionProps) {
  return <View style={styles.details}>{children}</View>;
}

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const { color } = useThemeContext();

  return (
    <View style={styles.detailRow}>
      <Txt txt={label} styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]} />
      <Txt txt={value} styles={[styles.detailValue, { color: color.TEXT }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  details: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
});
