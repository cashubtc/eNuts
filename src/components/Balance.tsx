import { SwapCurrencyIcon } from "@comps/Icons";
import { setPreferences } from "@db";
import type { RootStackParamList } from "@model/nav";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBalanceContext } from "@src/context/Balance";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { getColor } from "@styles/colors";
import { formatBalance, formatInt, formatSatStr, isBool } from "@util";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import { TxtButton } from "./Button";
import Txt from "./Txt";
import { usePaginatedHistory } from "coco-cashu-react";
import { LatestHistory } from "@screens/History/components/LatestHistory";

interface IBalanceProps {
  nav?: NativeStackNavigationProp<RootStackParamList, "dashboard", "MyStack">;
}

export default function Balance({ nav }: IBalanceProps) {
  const { t } = useTranslation([NS.common]);
  const { pref, color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const [formatSats, setFormatSats] = useState(pref?.formatBalance);
  const { balance } = useBalanceContext();
  const { history: latestHistory, hasMore } = usePaginatedHistory(3);

  const toggleBalanceFormat = () => {
    setFormatSats((prev) => !prev);
    if (!pref || !isBool(formatSats)) {
      return;
    }
    // update DB
    void setPreferences({ ...pref, formatBalance: !formatSats });
  };

  return (
    <View
      style={[
        styles.board,
        { borderColor: color.BORDER, backgroundColor: hi[highlight] },
      ]}
    >
      <TouchableOpacity
        style={styles.balanceWrap}
        onPress={toggleBalanceFormat}
        disabled={hidden.balance}
      >
        <Text
          testID={`balance: ${balance}`}
          style={[styles.balAmount, { color: getColor(highlight, color) }]}
        >
          {hidden.balance
            ? "****"
            : formatSats
            ? formatBalance(balance?.total)
            : formatInt(balance.total)}
        </Text>
        <View style={styles.balAssetNameWrap}>
          {!hidden.balance && (
            <>
              <Text
                style={[
                  styles.balAssetName,
                  { color: getColor(highlight, color) },
                ]}
              >
                {formatSats
                  ? "BTC"
                  : formatSatStr(balance?.total, "compact", false)}
              </Text>
              <SwapCurrencyIcon
                width={s(20)}
                height={s(20)}
                color={getColor(highlight, color)}
              />
            </>
          )}
        </View>
      </TouchableOpacity>
      {/* No transactions yet */}
      {!latestHistory.length && (
        <View style={styles.txOverview}>
          <Txt
            txt={t("noTX")}
            styles={[
              globals(color).pressTxt,
              { color: getColor(highlight, color) },
            ]}
          />
        </View>
      )}
      {/* latest 3 history entries */}
      <LatestHistory history={latestHistory} />
      {hasMore && (
        <TxtButton
          txt={t("seeFullHistory")}
          onPress={() => nav?.navigate("History", { screen: "HistoryMain" })}
          txtColor={getColor(highlight, color)}
          style={[{ paddingTop: s(15) }]}
        />
      )}
    </View>
  );
}

const styles = ScaledSheet.create({
  board: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingHorizontal: "20@s",
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
