import { AppText, fontScale, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { HistoryEntry } from "@cashu/coco-core";
import { usePrivacyContext } from "@src/context/Privacy";
import { useCurrencyContext } from "@src/context/Currency";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import EntryTime from "@screens/History/entryTime";
import { NS } from "@src/i18n";
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
  const theme = useAppThemeTokens();
  const { hidden } = usePrivacyContext();
  const { formatAmount } = useCurrencyContext();
  const { t } = useTranslation([NS.history, NS.common]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "History">>();
  // Use white/background color for highlight mode (colored background)
  // Use theme text colors for standard mode (white/drawer background)
  const textColor = variant === "highlight" ? theme.accentContrast : theme.text;
  const secondaryTextColor = variant === "highlight" ? theme.accentContrast : theme.textSecondary;
  const handlePress = () => {
    navigation.navigate("History", {
      screen: "HistoryEntryDetails",
      params: { entry },
    });
  };
  const { formatted, symbol } = formatAmount(amount);
  return (
    <PressableSurface style={styles.entry} onPress={handlePress}>
      <Stack style={styles.wrap}>
        <Stack style={styles.iconWrap}>{icon}</Stack>
        <Stack>
          <AppText
            style={[
              {
                color: textColor,
                marginBottom: 4,
              },
            ]}
            testID={`${name}-txt`}
          >
            {name}
          </AppText>
          <AppText
            style={{
              color: secondaryTextColor,
              fontSize: fontScale(12),
            }}
          >
            <EntryTime from={createdAt} fallback={t("justNow")} />
          </AppText>
        </Stack>
      </Stack>
      <AppText
        style={[{ color: textColor }]}
        testID={`${hidden.balance ? "****" : `${formatted} ${symbol}`}-txt`}
      >
        {hidden.balance ? "****" : `${formatted} ${symbol}`}
      </AppText>
    </PressableSurface>
  );
}
const styles = StyleSheet.create({
  board: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
    minHeight: "55%",
  },
  balanceWrap: {
    alignItems: "center",
    marginHorizontal: -20,
    marginBottom: 10,
  },
  balAmount: {
    alignItems: "center",
    fontSize: fontScale(42),
    fontWeight: "600",
  },
  balAssetNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    minHeight: 20,
  },
  balAssetName: {
    fontSize: fontScale(14),
    marginRight: 5,
  },
  iconWrap: {
    minWidth: 40,
    paddingTop: 3,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
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
