import Button from "@comps/Button";
import { AppText, globals, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { CheckmarkIcon } from "@comps/Icons";
import { ScreenWithKeyboard } from "@comps/Screen";
import { isIOS } from "@consts";
import type { RecoverMintsScreenProps } from "@src/nav/navTypes";
import { useKnownMints } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
export default function SelectRecoveryMintScreen({ navigation }: RecoverMintsScreenProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
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
      <Stack style={{ flex: 1, gap: 10 }}>
        <AppText style={[styles.hint]} weight="medium" testID={`${t("selectRestoreMint")}-txt`}>
          {t("selectRestoreMint")}
        </AppText>
        <ScrollView alwaysBounceVertical={false} style={{ flex: 1 }}>
          {knownMints.length > 0 ? (
            <Stack style={{ flex: 1, gap: 4 }}>
              {knownMints.map((mint) => {
                const isSelected = selectedMints.includes(mint.mintUrl);
                return (
                  <PressableSurface
                    key={mint.mintUrl}
                    style={[
                      styles.mintItem,
                      isSelected && {
                        backgroundColor: theme.accent + "20",
                        borderColor: theme.accent,
                      },
                    ]}
                    onPress={() => toggleMintSelection(mint.mintUrl)}
                    activeOpacity={0.7}
                  >
                    <Stack style={styles.mintContent}>
                      <AppText style={[{ flex: 1 }]} testID={`${mint.mintUrl}-txt`}>
                        {mint.mintUrl}
                      </AppText>
                      {isSelected && <CheckmarkIcon width={14} height={14} color={theme.accent} />}
                    </Stack>
                  </PressableSurface>
                );
              })}
            </Stack>
          ) : (
            <Stack style={styles.emptyContainer}>
              <AppText testID={`${t("noMint")}-txt`}>{t("noMint")}</AppText>
            </Stack>
          )}
        </ScrollView>
        <Stack style={styles.btnWrap}>
          <Button
            disabled={selectedMints.length === 0}
            txt={t("confirm")}
            onPress={() => {
              navigation.navigate("Recover");
            }}
          />
        </Stack>
      </Stack>
    </ScreenWithKeyboard>
  );
}
const styles = StyleSheet.create({
  hint: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mintItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  mintContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  btnWrap: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: isIOS ? 0 : 20,
  },
});
