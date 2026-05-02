import { SwapCurrencyIcon } from "@comps/Icons";
import type { RootStackParamList } from "@model/nav";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePaginatedHistory } from "@cashu/coco-react";
import { useBalanceContext } from "@src/context/Balance";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { AppText, Stack, globals, highlight as hi } from "@styles";
import { getColor } from "@styles/colors";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

import { TxtButton } from "./Button";
import Txt from "./Txt";
import { LatestHistory } from "@screens/History/components/LatestHistory";
import { useCurrencyContext } from "@src/context/Currency";

interface IBalanceProps {
  nav?: NativeStackNavigationProp<RootStackParamList, "dashboard", "MyStack">;
}

export default function Balance({ nav }: IBalanceProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const { balances } = useBalanceContext();
  const { history: latestHistory, hasMore } = usePaginatedHistory(3);
  const { formatAmount, formatBalance, setFormatBalance } = useCurrencyContext();

  const toggleBalanceFormat = () => {
    void setFormatBalance(!formatBalance);
  };

  return (
    <Stack
      borderBottomLeftRadius={50}
      borderBottomRightRadius={50}
      paddingHorizontal={20}
      paddingBottom={50}
      minHeight="55%"
      style={{ borderColor: color.BORDER, backgroundColor: hi[highlight] }}
    >
      <TouchableOpacity
        style={{ alignItems: "center", marginHorizontal: -20, marginBottom: 10 }}
        onPress={toggleBalanceFormat}
        disabled={hidden.balance}
      >
        <AppText
          testID={`balance: ${balances.total.total}`}
          weight="semibold"
          style={[
            {
              alignItems: "center",
              fontSize: 42,
              fontWeight: "600",
              color: getColor(highlight, color),
            },
          ]}
        >
          {hidden.balance ? "****" : formatAmount(balances.total.total).formatted}
        </AppText>
        <Stack flexDirection="row" alignItems="center" marginBottom={10} minHeight={20}>
          {!hidden.balance && (
            <>
              <AppText style={{ fontSize: 14, marginRight: 5, color: getColor(highlight, color) }}>
                {formatAmount(balances.total.total).symbol}
              </AppText>
              <SwapCurrencyIcon width={20} height={20} color={getColor(highlight, color)} />
            </>
          )}
        </Stack>
      </TouchableOpacity>
      {/* No transactions yet */}
      {!latestHistory.length && (
        <Stack flex={1} alignItems="center" justifyContent="center">
          <Txt
            txt={t("noTX")}
            styles={[globals(color).pressTxt, { color: getColor(highlight, color) }]}
          />
        </Stack>
      )}
      {/* latest 3 history entries */}
      <LatestHistory history={latestHistory} />
      {hasMore && (
        <TxtButton
          txt={t("seeFullHistory")}
          onPress={() => nav?.navigate("History", { screen: "HistoryMain" })}
          txtColor={getColor(highlight, color)}
          style={[{ paddingTop: 15 }]}
        />
      )}
    </Stack>
  );
}
