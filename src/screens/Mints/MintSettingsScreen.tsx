import Txt from "@comps/Txt";
import Screen from "@comps/Screen";

import { l } from "@log";
import ConfirmBottomSheet, {
  ConfirmBottomSheetRef,
} from "@comps/modal/ConfirmBottomSheet";
import { useKnownMints } from "@src/context/KnownMints";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";

import { mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { Image } from "expo-image";
import Button from "@comps/Button";
import { useManager } from "coco-cashu-react";

export default function MintSettingsScreen({ navigation, route }: any) {
  const { t } = useTranslation([NS.common]);
  const { openPromptAutoClose } = usePromptContext();
  const { color } = useThemeContext();
  const manager = useManager();
  const confirmSheetRef = useRef<ConfirmBottomSheetRef>(null);

  const { knownMints } = useKnownMints();
  const mint = knownMints.find((m) => m.mintUrl === route.params.mintUrl);

  const handleMintDelete = () => {
    void (async () => {
      try {
        await manager.mint.untrustMint(route.params.mintUrl);
      } catch (e) {
        l(e);
      }
    })();
  };

  return (
    <Screen
      screenName={t("mintSettings", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mint Header Card */}
        <View style={[styles.headerCard, { backgroundColor: color.INPUT_BG }]}>
          <View style={styles.headerContent}>
            {mint?.mintInfo?.icon_url && (
              <Image
                source={{ uri: mint.mintInfo.icon_url }}
                style={styles.mintIcon}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={styles.headerTextContainer}>
              {mint?.mintInfo?.name && (
                <Txt
                  txt={mint.mintInfo.name}
                  styles={[styles.mintName, { color: color.TEXT }]}
                />
              )}
              {mint?.mintInfo?.version && (
                <Txt
                  txt={`Version ${mint.mintInfo.version}`}
                  styles={[styles.mintVersion, { color: color.TEXT_SECONDARY }]}
                />
              )}
            </View>
          </View>
        </View>

        {/* Mint URL Section */}
        <View style={styles.section}>
          <Txt
            txt={t("general", { ns: NS.mints })}
            styles={[styles.sectionTitle, { color: color.TEXT_SECONDARY }]}
          />
          <View style={[styles.card, { backgroundColor: color.INPUT_BG }]}>
            <Txt
              txt={formatMintUrl(route.params.mintUrl)}
              styles={[styles.urlText, { color: color.TEXT }]}
            />
          </View>
        </View>

        {/* Metadata Section */}
        {mint?.mintInfo &&
          (mint.mintInfo.description ||
            mint.mintInfo.description_long ||
            (mint.mintInfo.contact && mint.mintInfo.contact.length > 0) ||
            mint.mintInfo.motd) && (
            <View style={styles.section}>
              <Txt
                txt={t("metadata", { ns: NS.mints })}
                styles={[styles.sectionTitle, { color: color.TEXT_SECONDARY }]}
              />
              <View style={[styles.card, { backgroundColor: color.INPUT_BG }]}>
                {mint.mintInfo.description && (
                  <InfoRow
                    label="Description"
                    value={mint.mintInfo.description}
                    hasSeparator={
                      !!mint.mintInfo.description_long ||
                      !!(
                        mint.mintInfo.contact &&
                        mint.mintInfo.contact.length > 0
                      ) ||
                      !!mint.mintInfo.motd
                    }
                  />
                )}
                {mint.mintInfo.description_long && (
                  <InfoRow
                    label="Details"
                    value={mint.mintInfo.description_long}
                    hasSeparator={
                      !!(
                        mint.mintInfo.contact &&
                        mint.mintInfo.contact.length > 0
                      ) || !!mint.mintInfo.motd
                    }
                  />
                )}
                {mint.mintInfo.contact && mint.mintInfo.contact.length > 0 && (
                  <>
                    {mint.mintInfo.contact.map((contact, index) => {
                      const isLast =
                        index === mint.mintInfo.contact!.length - 1;
                      const hasMotd = !!mint.mintInfo.motd;
                      return (
                        <InfoRow
                          key={`${contact.method}-${index}`}
                          label={contact.method}
                          value={contact.info}
                          hasSeparator={!isLast || hasMotd}
                        />
                      );
                    })}
                  </>
                )}
                {mint.mintInfo.motd && (
                  <InfoRow label="Message" value={mint.mintInfo.motd} />
                )}
              </View>
            </View>
          )}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Txt
            txt={t("dangerZone", { ns: NS.mints })}
            styles={[styles.sectionTitle, { color: mainColors.ERROR }]}
          />
          <Button
            txt={t("delMint", { ns: NS.mints })}
            destructive={true}
            onPress={() => {
              confirmSheetRef.current?.open({
                header: t("delMint", { ns: NS.mints }),
                txt: t("delMintSure", { ns: NS.mints }),
                confirmTxt: t("confirm", { ns: NS.common }),
                cancelTxt: t("cancel", { ns: NS.common }),
                onConfirm: () => {},
                destructive: true,
              });
            }}
          />
        </View>
      </ScrollView>
      <ConfirmBottomSheet ref={confirmSheetRef} />
    </Screen>
  );
}

interface IInfoRow {
  label: string;
  value: string;
  hasSeparator?: boolean;
}

function InfoRow({ label, value, hasSeparator }: IInfoRow) {
  const { color } = useThemeContext();
  return (
    <>
      <View style={styles.infoRow}>
        <Txt
          txt={label}
          styles={[styles.infoLabel, { color: color.TEXT_SECONDARY }]}
        />
        <Txt txt={value} styles={[styles.infoValue, { color: color.TEXT }]} />
      </View>
      {hasSeparator && (
        <View
          style={[styles.infoSeparator, { backgroundColor: color.BORDER }]}
        />
      )}
    </>
  );
}

const styles = ScaledSheet.create({
  headerCard: {
    borderRadius: "16@s",
    padding: "20@s",
    marginTop: "16@vs",
    marginBottom: "24@vs",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mintIcon: {
    width: "48@s",
    height: "48@s",
    borderRadius: "12@s",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: "16@s",
  },
  mintName: {
    fontSize: "20@vs",
    fontWeight: "700",
    marginBottom: "4@vs",
    letterSpacing: 0.3,
  },
  mintVersion: {
    fontSize: "13@vs",
    fontWeight: "500",
    opacity: 0.7,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: "12@vs",
    paddingHorizontal: "16@s",
    borderRadius: "12@s",
    gap: "8@s",
  },
  balanceText: {
    fontSize: "18@vs",
    fontWeight: "600",
  },
  section: {
    marginBottom: "24@vs",
  },
  sectionTitle: {
    fontSize: "12@vs",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: "12@vs",
    paddingHorizontal: "4@s",
  },
  card: {
    borderRadius: "16@s",
    padding: "20@s",
  },
  urlText: {
    fontSize: "14@vs",
    fontWeight: "500",
    lineHeight: "20@vs",
  },
  infoRow: {
    paddingVertical: "8@vs",
  },
  infoLabel: {
    fontSize: "12@vs",
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: "6@vs",
  },
  infoValue: {
    fontSize: "14@vs",
    fontWeight: "400",
    lineHeight: "20@vs",
  },
  infoSeparator: {
    height: 1,
    marginVertical: "12@vs",
    opacity: 0.2,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16@s",
    padding: "16@s",
    borderWidth: 1.5,
    gap: "10@s",
  },
  deleteButtonText: {
    fontSize: "15@vs",
    fontWeight: "600",
  },
});
