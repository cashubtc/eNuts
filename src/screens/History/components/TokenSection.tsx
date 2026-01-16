import Copy from "@comps/Copy";
import Txt from "@comps/Txt";
import Separator from "@comps/Separator";
import { useThemeContext } from "@src/context/Theme";
import { View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

const truncateStr = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

type TokenSectionProps = {
  label: string;
  value: string;
};

export function TokenSection({ label, value }: TokenSectionProps) {
  const { color } = useThemeContext();

  return (
    <>
      <Separator style={styles.separator} />
      <View style={styles.tokenSection}>
        <View style={styles.tokenHeader}>
          <Txt
            txt={label}
            styles={[styles.sectionTitle, { color: color.TEXT }]}
          />
          <Copy txt={value} />
        </View>
        <View
          style={[styles.tokenContainer, { backgroundColor: color.INPUT_BG }]}
        >
          <Txt
            txt={truncateStr(value, 100)}
            styles={[styles.tokenValue, { color: color.TEXT_SECONDARY }]}
          />
        </View>
      </View>
    </>
  );
}

const styles = ScaledSheet.create({
  separator: {
    marginVertical: "10@vs",
  },
  tokenSection: {
    paddingHorizontal: "15@s",
    paddingBottom: "15@vs",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10@vs",
  },
  sectionTitle: {
    fontSize: "16@vs",
    fontWeight: "600",
  },
  tokenValue: {
    fontSize: "14@vs",
  },
  tokenContainer: {
    padding: "10@s",
    borderRadius: "8@s",
  },
});
