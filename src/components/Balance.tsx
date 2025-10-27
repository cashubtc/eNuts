import {
  CheckmarkIcon,
  ClockIcon,
  CloseCircleIcon,
  EcashIcon,
  SwapCurrencyIcon,
  ZapIcon,
} from "@comps/Icons";
import { setPreferences } from "@db";
import { type TTXType, txType } from "@model";
import type { RootStackParamList } from "@model/nav";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EntryTime from "@screens/History/entryTime";
import { useBalanceContext } from "@src/context/Balance";
import { useHistoryContext } from "@src/context/History";
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
import Logo from "./Logo";
import Txt from "./Txt";
import { usePaginatedHistory } from "coco-cashu-react";
// removed unused MintHistoryEntry import
import { LatestHistory } from "@screens/History/components/LatestHistory";

interface IBalanceProps {
  nav?: NativeStackNavigationProp<RootStackParamList, "dashboard", "MyStack">;
}

export default function Balance({ nav }: IBalanceProps) {
  const { t } = useTranslation([NS.common]);
  const { pref, color, highlight } = useThemeContext();
  const { hidden, handleLogoPress } = usePrivacyContext();
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
      <TouchableOpacity onPress={() => void handleLogoPress()}>
        <Logo size={s(40)} style={{ marginTop: s(10), marginBottom: s(10) }} />
      </TouchableOpacity>
      {/* balance */}
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

interface IHistoryEntryProps {
  icon: React.ReactNode;
  txType: string;
  isSwap?: boolean;
  timestamp: number;
  amount: number;
  isExpired?: boolean;
  onPress: () => void;
  testID: string;
}

function HistoryEntry({
  icon,
  txType,
  isSwap,
  timestamp,
  amount,
  isExpired,
  onPress,
  testID,
}: IHistoryEntryProps) {
  const { t } = useTranslation([NS.history]);
  const { color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();

  const getAmount = () => {
    if (hidden.balance) {
      return "****";
    }
    if (isSwap) {
      return formatSatStr(Math.abs(amount));
    }
    return `${amount > 0 ? "+" : ""}${formatSatStr(amount)}`;
  };

  return (
    <TouchableOpacity style={styles.entry} onPress={onPress} testID={testID}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>{icon}</View>
        <View>
          <Txt
            txt={txType}
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
            <EntryTime from={timestamp * 1000} fallback={t("justNow")} />
          </Text>
        </View>
      </View>
      <Txt
        txt={isExpired ? t("expired", { ns: NS.common }) : getAmount()}
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
