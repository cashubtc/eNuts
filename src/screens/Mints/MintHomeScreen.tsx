import Button, { IconBtn, TxtButton } from "@comps/Button";
import Card from "@comps/Card";
import Empty from "@comps/Empty";
import { ChevronRightIcon, PlusIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import Screen from "@comps/Screen";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { getColor } from "@styles/colors";
import { formatMintUrl } from "@util";
import { useCurrencyContext } from "@src/context/Currency";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function MintHomeScreen({ navigation }: any) {
  const { t } = useTranslation([NS.common]);
  const { knownMints } = useKnownMints();
  const { color, highlight } = useThemeContext();
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
          <PlusIcon width={s(30)} height={s(30)} color={hi[highlight]} />
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {knownMints.length > 0 ? (
          <View
            style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}
          >
            {/* Mints list */}
            <ScrollView alwaysBounceVertical={false}>
              {knownMints.map((m, i) => {
                const displayName = m.mintInfo.name || formatMintUrl(m.mintUrl);
                const { formatted, symbol } = formatAmount(m.balance);
                const displayBalance = hidden.balance
                  ? "****"
                  : `${formatted} ${symbol}`;

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
                      marginBottom: i < knownMints.length - 1 ? s(12) : 0,
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
                          <Txt
                            txt={displayName}
                            bold
                            styles={[{ color: color.TEXT }]}
                          />
                          <Txt
                            txt={displayBalance}
                            styles={[
                              {
                                color: color.TEXT_SECONDARY,
                                fontSize: s(12),
                                marginTop: vs(2),
                              },
                            ]}
                          />
                        </View>

                        {/* Right side: Chevron icon */}
                        <View style={styles.chevronContainer}>
                          <ChevronRightIcon color={color.TEXT} />
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

const styles = ScaledSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  noMintContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: "20@s",
  },
  noMintBottomSection: {
    position: "absolute",
    bottom: "20@s",
    right: "20@s",
    left: "20@s",
    rowGap: "20@s",
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
    padding: "12@s",
  },
  mintContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: "12@s",
  },
  icon: {
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  chevronContainer: {
    marginLeft: "8@s",
  },
});
