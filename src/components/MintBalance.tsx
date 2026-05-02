import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { Stack, highlight as hi } from "@styles";

import { MintBoardIcon } from "./Icons";
import Txt from "./Txt";

interface IMintBalanceProps {
  balance: number;
  txtColor: string;
  disabled?: boolean;
}

export default function MintBalance({ balance, txtColor, disabled }: IMintBalanceProps) {
  const { color, highlight } = useThemeContext();
  const { hidden } = usePrivacyContext();
  const { formatAmount } = useCurrencyContext();

  const { formatted, symbol } = formatAmount(balance);

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      borderWidth={1}
      paddingVertical={4}
      paddingHorizontal={6}
      borderRadius={20}
      style={{ borderColor: disabled ? color.TEXT_SECONDARY : hi[highlight] }}
    >
      <MintBoardIcon
        width={16}
        height={16}
        color={disabled ? color.TEXT_SECONDARY : hi[highlight]}
      />
      <Txt
        txt={hidden.balance ? "****" : `${formatted} ${symbol}`}
        styles={[{ fontSize: 10, color: txtColor, marginLeft: 5 }]}
      />
    </Stack>
  );
}
