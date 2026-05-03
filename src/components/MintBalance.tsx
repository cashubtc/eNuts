import { usePrivacyContext } from "@src/context/Privacy";
import { useCurrencyContext } from "@src/context/Currency";
import { fontScale, Stack, useAppThemeTokens } from "@styles";

import { MintBoardIcon } from "./Icons";
import Txt from "./Txt";

interface IMintBalanceProps {
  balance: number;
  txtColor: string;
  disabled?: boolean;
}

export default function MintBalance({ balance, txtColor, disabled }: IMintBalanceProps) {
  const { hidden } = usePrivacyContext();
  const { formatAmount } = useCurrencyContext();
  const theme = useAppThemeTokens();

  const { formatted, symbol } = formatAmount(balance);

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      borderWidth={1}
      paddingVertical={4}
      paddingHorizontal={6}
      borderRadius={20}
      style={{ borderColor: disabled ? theme.textSecondary : theme.accent }}
    >
      <MintBoardIcon width={16} height={16} color={disabled ? theme.textSecondary : theme.accent} />
      <Txt
        txt={hidden.balance ? "****" : `${formatted} ${symbol}`}
        styles={[{ fontSize: fontScale(10), color: txtColor, marginLeft: 5 }]}
      />
    </Stack>
  );
}
