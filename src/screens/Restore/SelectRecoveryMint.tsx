import Button from "@comps/Button";
import { highlight as hi } from "@styles";
import { CheckmarkIcon } from "@comps/Icons";
import { ScreenWithKeyboard } from "@comps/Screen";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import type { RecoverMintsScreenProps } from "@src/nav/navTypes";
import { useKnownMints } from "@src/context/KnownMints";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { vs } from "react-native-size-matters";

export default function SelectRecoveryMintScreen({ navigation }: RecoverMintsScreenProps) {
  const { t } = useTranslation([NS.common]);
  const { highlight, color } = useThemeContext();

  const { knownMints } = useKnownMints();
  const [selectedMints, setSelectedMints] = useState<string[]>(
    knownMints.map((mint) => mint.mintUrl),
  );

  const toggleMintSelection = (mintUrl: string) => {
    setSelectedMints((prev) =>
      prev.includes(mintUrl) ? prev.filter((m) => m !== mintUrl) : [...prev, mintUrl],
    );
  };

  return (
    <ScreenWithKeyboard
      screenName={t("walletRecovery")}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={{ flex: 1, gap: s(10) }}>
        <Txt txt={t("selectRestoreMint")} styles={[styles.hint]} bold />
        <ScrollView alwaysBounceVertical={false} style={{ flex: 1 }}>
          {knownMints.length > 0 ? (
            <View style={{ flex: 1, gap: s(4) }}>
              {knownMints.map((mint) => {
                const isSelected = selectedMints.includes(mint.mintUrl);
                return (
                  <TouchableOpacity
                    key={mint.mintUrl}
                    style={[
                      styles.mintItem,
                      isSelected && {
                        backgroundColor: hi[highlight] + "20",
                        borderColor: hi[highlight],
                      },
                    ]}
                    onPress={() => toggleMintSelection(mint.mintUrl)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mintContent}>
                      <Txt txt={mint.mintUrl} styles={[{ flex: 1 }]} />
                      {isSelected && (
                        <CheckmarkIcon width={vs(14)} height={vs(14)} color={hi[highlight]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Txt txt={t("noMint")} />
            </View>
          )}
        </ScrollView>
        <View style={styles.btnWrap}>
          <Button
            disabled={selectedMints.length === 0}
            txt={t("confirm")}
            onPress={() => {
              navigation.navigate("Recover");
            }}
          />
        </View>
      </View>
    </ScreenWithKeyboard>
  );
}

const styles = ScaledSheet.create({
  hint: {
    paddingHorizontal: "20@s",
    marginBottom: "20@vs",
  },
  mintItem: {
    padding: "16@s",
    borderRadius: "12@s",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: "8@s",
  },
  mintContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: "12@s",
  },
  emptyContainer: {
    padding: "20@s",
    alignItems: "center",
  },
  btnWrap: {
    marginHorizontal: "20@s",
    marginTop: "20@s",
    marginBottom: isIOS ? "0@s" : "20@s",
  },
});
