import Button, { IconBtn, TxtButton } from "@comps/Button";
import Card from "@comps/Card";
import Empty from "@comps/Empty";
import { ChevronRightIcon, PlusIcon } from "@comps/Icons";
import Screen from "@comps/Screen";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { NS } from "@src/i18n";
import { AppText, appFontSize, globals, PressableSurface, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl } from "@util";
import { useCurrencyContext } from "@src/context/Currency";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function MintHomeScreen({ navigation }: any) {
  const { t } = useTranslation([NS.common]);
  const { knownMints } = useKnownMints();
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const insets = useSafeAreaInsets();
  const { hidden } = usePrivacyContext();
  return (
    <Screen
      screenName="Mints"
      withBackBtn
      handlePress={() => navigation.goBack()}
      rightAction={
        <PressableSurface
          onPress={() => {
            navigation.navigate("Mint", { screen: "MintAdd" });
          }}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <PlusIcon width={30} height={30} color={theme.accent} />
        </PressableSurface>
      }
    >
      <Stack style={styles.container}>
        {knownMints.length > 0 ? (
          <Stack style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}>
            {/* Mints list */}
            <ScrollView alwaysBounceVertical={false}>
              {knownMints.map((m, i) => {
                const displayName = m.mintInfo.name || formatMintUrl(m.mintUrl);
                const { formatted, symbol } = formatAmount(m.balance);
                const displayBalance = hidden.balance ? "****" : `${formatted} ${symbol}`;
                return (
                  <PressableSurface
                    key={m.mintUrl}
                    onPress={() => {
                      navigation.navigate("MintSettings", {
                        mintUrl: m.mintUrl,
                      });
                    }}
                    activeOpacity={0.7}
                    style={{
                      marginBottom: i < knownMints.length - 1 ? 12 : 0,
                    }}
                  >
                    <Card variant="base" style={styles.cardContent}>
                      <Stack style={styles.mintContainer}>
                        {/* Left side: Mint icon (if available) */}
                        {m.mintInfo.icon_url && (
                          <Stack style={styles.iconContainer}>
                            <Image
                              source={{ uri: m.mintInfo.icon_url }}
                              style={styles.icon}
                              contentFit="cover"
                              transition={200}
                            />
                          </Stack>
                        )}

                        {/* Center: Mint name and balance */}
                        <Stack style={styles.infoContainer}>
                          <AppText
                            style={[{ color: theme.text }]}
                            weight="medium"
                            testID={`${displayName}-txt`}
                          >
                            {displayName}
                          </AppText>
                          <AppText
                            style={[
                              {
                                color: theme.textSecondary,
                                fontSize: appFontSize.caption,
                                marginTop: 2,
                              },
                            ]}
                            testID={`${displayBalance}-txt`}
                          >
                            {displayBalance}
                          </AppText>
                        </Stack>

                        {/* Right side: Chevron icon */}
                        <Stack style={styles.chevronContainer}>
                          <ChevronRightIcon color={theme.text} />
                        </Stack>
                      </Stack>
                    </Card>
                  </PressableSurface>
                );
              })}
            </ScrollView>
          </Stack>
        ) : (
          <Stack style={styles.noMintContainer}>
            <Empty txt={t("noMint")} />
          </Stack>
        )}
      </Stack>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  noMintContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
  },
  noMintBottomSection: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    rowGap: 20,
  },
  topSection: {
    width: "100%",
  },
  newMint: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  cardContent: {
    padding: 12,
  },
  mintContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  chevronContainer: {
    marginLeft: 8,
  },
});
