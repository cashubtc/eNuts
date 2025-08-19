import Button, { IconBtn } from "@comps/Button";
import Empty from "@comps/Empty";
import { ChevronRightIcon, PlusIcon, ZapIcon } from "@comps/Icons";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import TopNav from "@nav/TopNav";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { MintHomeScreenProps } from "@src/nav/navTypes";
import { globals, highlight as hi } from "@styles";
import { getColor } from "@styles/colors";
import { formatMintUrl, formatSatStr } from "@util";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet } from "react-native-size-matters";

export default function MintHomeScreen({ navigation }: MintHomeScreenProps) {
  const { t } = useTranslation([NS.common]);
  const { knownMints } = useKnownMints();
  const { color, highlight } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { hidden } = usePrivacyContext();

  return (
    <View style={[globals(color).container, styles.container]}>
      <TopNav
        screenName="Mints"
        withBackBtn
        handlePress={() => navigation.goBack()}
      />
      {knownMints.length > 0 ? (
        <View style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}>
          {/* Mints list where test mint is always visible */}
          <ScrollView
            style={globals(color).wrapContainer}
            alwaysBounceVertical={false}
          >
            {knownMints.map((m, i) => (
              <View key={m.mintUrl}>
                <TouchableOpacity
                  style={[globals().wrapRow, { paddingBottom: s(15) }]}
                  onPress={() => {
                    navigation.navigate("MintSettings", {
                      mintUrl: m.mintUrl,
                    });
                  }}
                >
                  <View style={styles.mintNameWrap}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Txt txt={m.name || formatMintUrl(m.mintUrl)} bold />
                    </View>
                    <View style={styles.mintBal}>
                      {m.balance > 0 && <ZapIcon color={hi[highlight]} />}
                      <Text
                        style={{
                          color:
                            m.balance > 0 ? color.TEXT : color.TEXT_SECONDARY,
                          marginLeft: m.balance > 0 ? 5 : 0,
                          marginBottom: 5,
                        }}
                      >
                        {hidden.balance
                          ? "****"
                          : m.balance > 0
                          ? formatSatStr(m.balance, "compact")
                          : t("emptyMint")}
                      </Text>
                    </View>
                  </View>
                  {/* Add mint icon or show balance */}
                  <View>
                    <ChevronRightIcon color={color.TEXT} />
                  </View>
                </TouchableOpacity>
                {i < knownMints.length - 1 && (
                  <Separator style={[{ marginBottom: s(15) }]} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noMintContainer}>
          <Empty txt={t("noMint")} />
          <View style={styles.noMintBottomSection}>
            <Button
              txt={t("addNewMint", { ns: NS.mints })}
              onPress={() => {
                navigation.navigate("Mint", { screen: "MintAdd" });
              }}
            />
          </View>
        </View>
      )}
      {/* add new mint button */}
      {knownMints.length > 0 && (
        <View style={[styles.newMint, { marginBottom: insets.bottom }]}>
          <IconBtn
            icon={
              <PlusIcon
                width={s(30)}
                height={s(30)}
                color={getColor(highlight, color)}
              />
            }
            onPress={() => {
              navigation.navigate("MintAdd");
            }}
          />
        </View>
      )}
    </View>
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
    // marginTop: 110,
  },
  wrap: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  inputQR: {
    position: "absolute",
    right: "13@s",
    height: "41@vs",
    paddingHorizontal: "10@s",
  },
  newMint: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  mintNameWrap: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  mintBal: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  cancel: {
    alignItems: "center",
    marginTop: 15,
    padding: 10,
    width: "100%",
  },
});
