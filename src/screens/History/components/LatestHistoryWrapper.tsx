import Txt from "@comps/Txt";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { getColor } from "@src/styles/colors";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import EntryTime from "@screens/History/entryTime";
import { formatSatStr } from "@util";
import { NS } from "@src/i18n";
import { HistoryEntry } from "coco-cashu-core";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@src/model/nav";

type LatestHistoryWrapperProps = {
  icon: React.ReactNode;
  name: string;
  createdAt: number;
  amount: number;
  variant?: "highlight" | "standard";
  entry: HistoryEntry;
};

export function LatestHistoryWrapper({
  icon,
  name,
  createdAt,
  amount,
  variant = "highlight",
  entry,
}: LatestHistoryWrapperProps) {
  const { color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const { t } = useTranslation([NS.history, NS.common]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "History">>();

  // Use white/background color for highlight mode (colored background)
  // Use theme text colors for standard mode (white/drawer background)
  const textColor =
    variant === "highlight" ? getColor(highlight, color) : color.TEXT;
  const secondaryTextColor =
    variant === "highlight" ? getColor(highlight, color) : color.TEXT_SECONDARY;

  const handlePress = () => {
    navigation.navigate("History", {
      screen: "HistoryEntryDetails",
      params: { entry },
    });
  };

  return (
    <TouchableOpacity style={styles.entry} onPress={handlePress}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>{icon}</View>
        <View>
          <Txt
            txt={name}
            styles={[
              {
                color: textColor,
                marginBottom: s(4),
              },
            ]}
          />
          <Text
            style={{
              color: secondaryTextColor,
              fontSize: s(12),
            }}
          >
            <EntryTime from={createdAt} fallback={t("justNow")} />
          </Text>
        </View>
      </View>
      <Txt
        txt={hidden.balance ? "****" : formatSatStr(amount)}
        styles={[{ color: textColor }]}
      />
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  board: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingHorizontal: "20@s",
    paddingTop: "40@s",
    paddingBottom: "50@s",
    minHeight: "55%",
  },
  balanceWrap: {
    alignItems: "center",
    marginHorizontal: "-20@s",
    marginBottom: "10@s",
  },
  balAmount: {
    alignItems: "center",
    fontSize: "42@s",
    fontWeight: "600",
  },
  balAssetNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "10@s",
    minHeight: "20@s",
  },
  balAssetName: {
    fontSize: "14@vs",
    marginRight: "5@s",
  },
  iconWrap: {
    minWidth: "40@s",
    paddingTop: "3@s",
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "10@s",
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  txOverview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
