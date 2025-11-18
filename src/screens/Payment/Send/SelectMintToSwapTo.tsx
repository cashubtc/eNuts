import { ChevronRightIcon, MintBoardIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { IMintUrl } from "@model";
import type { TSelectMintToSwapToPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

export default function SelectMintToSwapToScreen({
  navigation,
  route,
}: TSelectMintToSwapToPageProps) {
  const { mint, balance, remainingMints } = route.params;
  const { t } = useTranslation([NS.mints]);
  const { color, highlight } = useThemeContext();
  // the default mint url if user has set one
  const handlePressMint = (targetMint: IMintUrl) => {
    navigation.navigate("selectAmount", {
      mint,
      balance,
      isSwap: true,
      targetMint,
    });
  };
  // Show user mints with balances and default mint icon

  return (
    <Screen
      screenName={t("multimintSwap", { ns: NS.common })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <Txt txt={t("selectSwapReceiver")} styles={[styles.hint]} />
      {remainingMints && remainingMints.length > 0 && (
        <ScrollView alwaysBounceVertical={false}>
          <View style={globals(color).wrapContainer}>
            {remainingMints.map((m, i) => (
              <View key={m.mintUrl}>
                <TouchableOpacity
                  key={m.mintUrl}
                  style={styles.mintUrlWrap}
                  onPress={() => void handlePressMint(m)}
                >
                  <View style={styles.mintNameWrap}>
                    <Txt txt={m.customName || formatMintUrl(m.mintUrl)} />
                  </View>
                  <ChevronRightIcon color={color.TEXT} />
                </TouchableOpacity>
                {i < remainingMints.length - 1 && <Separator />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = ScaledSheet.create({
  hint: {
    paddingHorizontal: "20@s",
    marginBottom: "20@vs",
    fontWeight: "500",
  },
  mintUrlWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "20@vs",
  },
  mintNameWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});
