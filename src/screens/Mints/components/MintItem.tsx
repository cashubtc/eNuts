import { ChevronRightIcon, ZapIcon } from "@comps/Icons";
import Separator from "@comps/Separator";
import { formatMintUrl } from "@util";
import { useCurrencyContext } from "@src/context/Currency";
import { TouchableOpacity, View } from "react-native";
import { AppText, globals, useAppThemeTokens } from "@styles";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "@model/nav";
interface MintItemProps {
  mint: {
    mintUrl: string;
    name?: string;
    balance: number;
  };
  navigation: NavigationProp<RootStackParamList>;
  isLast: boolean;
  color: any;
  highlight: string;
  hidden: {
    balance: boolean;
  };
  t: (key: string) => string;
  formatAmount: (sats: number) => {
    formatted: string;
    symbol: string;
  };
}
const styles = {
  mintNameWrap: {
    flexDirection: "column" as const,
    alignItems: "flex-start" as const,
  },
  mintBal: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginTop: 10,
  },
};
export default function MintItem({
  mint,
  navigation,
  isLast,
  color,
  highlight,
  hidden,
  t,
  formatAmount,
}: MintItemProps) {
  const { formatted, symbol } = formatAmount(mint.balance);
  const theme = useAppThemeTokens();
  return (
    <View key={mint.mintUrl}>
      <TouchableOpacity
        style={[globals().wrapRow, { paddingBottom: 15 }]}
        onPress={() => {
          navigation.navigate("mintmanagement", {
            mint: {
              mintUrl: mint.mintUrl,
              customName: mint.name,
            },
            amount: mint.balance,
            remainingMints: [],
          });
        }}
      >
        <View style={styles.mintNameWrap}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <AppText weight="medium" testID={`${mint.name || formatMintUrl(mint.mintUrl)}-txt`}>
              {mint.name || formatMintUrl(mint.mintUrl)}
            </AppText>
          </View>
          <View style={styles.mintBal}>
            {mint.balance > 0 && <ZapIcon color={theme.accent} />}
            <AppText
              style={{
                color: mint.balance > 0 ? theme.text : theme.textSecondary,
                marginLeft: mint.balance > 0 ? 5 : 0,
                marginBottom: 5,
              }}
            >
              {hidden.balance
                ? "****"
                : mint.balance > 0
                  ? `${formatted} ${symbol}`
                  : t("emptyMint")}
            </AppText>
          </View>
        </View>
        <ChevronRightIcon color={theme.text} />
      </TouchableOpacity>
      {!isLast && <Separator style={[{ marginBottom: 15 }]} />}
    </View>
  );
}
