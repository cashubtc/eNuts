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

type LatestHistoryWrapperProps = {
  icon: React.ReactNode;
  name: string;
  createdAt: number;
  amount: number;
};

export function LatestHistoryWrapper({
  icon,
  name,
  createdAt,
  amount,
}: LatestHistoryWrapperProps) {
  const { color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const { t } = useTranslation([NS.history, NS.common]);

  return (
    <TouchableOpacity style={styles.entry}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>{icon}</View>
        <View>
          <Txt
            txt={name}
            styles={[
              {
                color: getColor(highlight, color),
                marginBottom: s(4),
              },
            ]}
          />
          <Text
            style={{
              color: getColor(highlight, color),
              fontSize: s(12),
            }}
          >
            <EntryTime from={createdAt} fallback={t("justNow")} />
          </Text>
        </View>
      </View>
      <Txt
        txt={hidden.balance ? "****" : formatSatStr(amount)}
        styles={[{ color: getColor(highlight, color) }]}
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
