import { SwapCurrencyIcon } from "@comps/Icons";
import type { RootStackParamList } from "@model/nav";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePaginatedHistory } from "@cashu/coco-react";
import { useBalanceContext } from "@src/context/Balance";
import { usePrivacyContext } from "@src/context/Privacy";
import { NS } from "@src/i18n";
import { AppText, PressableSurface, Stack, useAppThemeTokens } from "@styles";
import { useTranslation } from "react-i18next";
import { TxtButton } from "./Button";
import { LatestHistory } from "@screens/History/components/LatestHistory";
import { useCurrencyContext } from "@src/context/Currency";
interface IBalanceProps {
  nav?: NativeStackNavigationProp<RootStackParamList, "dashboard", "MyStack">;
}
export default function Balance({ nav }: IBalanceProps) {
  const { t } = useTranslation([NS.common]);
  const { hidden } = usePrivacyContext();
  const { balances } = useBalanceContext();
  const { history: latestHistory, hasMore } = usePaginatedHistory(3);
  const { formatAmount, formatBalance, setFormatBalance } = useCurrencyContext();
  const theme = useAppThemeTokens();
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
      backgroundColor="$accent"
      borderColor="$borderColor"
    >
      <PressableSurface
        style={{ alignItems: "center", marginHorizontal: -20, marginBottom: 10 }}
        onPress={toggleBalanceFormat}
        disabled={hidden.balance}
      >
        <AppText
          testID={`balance: ${balances.total.total}`}
          size="balance"
          weight="semibold"
          style={[
            {
              alignItems: "center",
              color: theme.accentContrast,
            },
          ]}
        >
          {hidden.balance ? "****" : formatAmount(balances.total.total).formatted}
        </AppText>
        <Stack flexDirection="row" alignItems="center" marginBottom={10} minHeight={20}>
          {!hidden.balance && (
            <>
              <AppText size="body" style={{ marginRight: 5, color: theme.accentContrast }}>
                {formatAmount(balances.total.total).symbol}
              </AppText>
              <SwapCurrencyIcon width={20} height={20} color={theme.accentContrast} />
            </>
          )}
        </Stack>
      </PressableSurface>
      {/* No transactions yet */}
      {!latestHistory.length && (
        <Stack flex={1} alignItems="center" justifyContent="center">
          <AppText
            style={[{ color: theme.accentContrast, textAlign: "center" }]}
            testID={`${t("noTX")}-txt`}
          >
            {t("noTX")}
          </AppText>
        </Stack>
      )}
      {/* latest 3 history entries */}
      <LatestHistory history={latestHistory} />
      {hasMore && (
        <TxtButton
          txt={t("seeFullHistory")}
          onPress={() => nav?.navigate("History", { screen: "HistoryMain" })}
          txtColor={theme.accentContrast}
          style={[{ paddingTop: 15 }]}
        />
      )}
    </Stack>
  );
}
