import Button, { IconBtn, TxtButton } from "@comps/Button";
import Card from "@comps/Card";
import Empty from "@comps/Empty";
import { ChevronRightIcon, PlusIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import Screen from "@comps/Screen";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { NS } from "@src/i18n";
import { globals, useAppThemeTokens } from "@styles";
import { formatMintUrl } from "@util";
import { useCurrencyContext } from "@src/context/Currency";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View, StyleSheet } from "react-native";
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
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Mint", { screen: "MintAdd" });
          }}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <PlusIcon width={30} height={30} color={theme.accent} />
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {knownMints.length > 0 ? (
          <View style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}>
            {/* Mints list */}
            <ScrollView alwaysBounceVertical={false}>
              {knownMints.map((m, i) => {
                const displayName = m.mintInfo.name || formatMintUrl(m.mintUrl);
                const { formatted, symbol } = formatAmount(m.balance);
                const displayBalance = hidden.balance ? "****" : `${formatted} ${symbol}`;

                return (
                  <TouchableOpacity
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
                      <View style={styles.mintContainer}>
                        {/* Left side: Mint icon (if available) */}
                        {m.mintInfo.icon_url && (
                          <View style={styles.iconContainer}>
                            <Image
                              source={{ uri: m.mintInfo.icon_url }}
                              style={styles.icon}
                              contentFit="cover"
                              transition={200}
                            />
                          </View>
                        )}

                        {/* Center: Mint name and balance */}
                        <View style={styles.infoContainer}>
                          <Txt txt={displayName} bold styles={[{ color: theme.text }]} />
                          <Txt
                            txt={displayBalance}
                            styles={[
                              {
                                color: theme.textSecondary,
                                fontSize: 12,
                                marginTop: 2,
                              },
                            ]}
                          />
                        </View>

                        {/* Right side: Chevron icon */}
                        <View style={styles.chevronContainer}>
                          <ChevronRightIcon color={theme.text} />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.noMintContainer}>
            <Empty txt={t("noMint")} />
          </View>
        )}
      </View>
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
