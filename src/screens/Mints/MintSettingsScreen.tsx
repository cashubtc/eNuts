import Txt from "@comps/Txt";
import Screen from "@comps/Screen";
import { useTrustedMints } from "@cashu/coco-react";

import { l } from "@log";
import ConfirmBottomSheet, { ConfirmBottomSheetRef } from "@comps/modal/ConfirmBottomSheet";
import { useKnownMints } from "@src/context/KnownMints";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";

import { verticalScale, fontScale, useAppThemeTokens } from "@styles";
import { formatMintUrl } from "@util";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Button from "@comps/Button";

export default function MintSettingsScreen({ navigation, route }: any) {
  const { t } = useTranslation([NS.common]);
  const { untrustMint } = useTrustedMints();
  const { openPromptAutoClose } = usePromptContext();
  const theme = useAppThemeTokens();
  const confirmSheetRef = useRef<ConfirmBottomSheetRef>(null);

  const { knownMints } = useKnownMints();
  const mint = knownMints.find((m) => m.mintUrl === route.params.mintUrl);

  const handleMintDelete = () => {
    void (async () => {
      try {
        await untrustMint(route.params.mintUrl);
        navigation.goBack();
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
        <View style={[styles.headerCard, { backgroundColor: theme.inputBackground }]}>
          <View style={styles.headerContent}>
            {mint?.mintInfo?.icon_url && (
              <Image
                source={{ uri: mint.mintInfo.icon_url }}
                style={[styles.mintIcon, { backgroundColor: theme.mintIconBackground }]}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={styles.headerTextContainer}>
              {mint?.mintInfo?.name && (
                <Txt txt={mint.mintInfo.name} styles={[styles.mintName, { color: theme.text }]} />
              )}
              {mint?.mintInfo?.version && (
                <Txt
                  txt={`Version ${mint.mintInfo.version}`}
                  styles={[styles.mintVersion, { color: theme.textSecondary }]}
                />
              )}
            </View>
          </View>
        </View>

        {/* Mint URL Section */}
        <View style={styles.section}>
          <Txt
            txt={t("general", { ns: NS.mints })}
            styles={[styles.sectionTitle, { color: theme.textSecondary }]}
          />
          <View style={[styles.card, { backgroundColor: theme.inputBackground }]}>
            <Txt
              txt={formatMintUrl(route.params.mintUrl)}
              styles={[styles.urlText, { color: theme.text }]}
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
                styles={[styles.sectionTitle, { color: theme.textSecondary }]}
              />
              <View style={[styles.card, { backgroundColor: theme.inputBackground }]}>
                {mint.mintInfo.description && (
                  <InfoRow
                    label="Description"
                    value={mint.mintInfo.description}
                    hasSeparator={
                      !!mint.mintInfo.description_long ||
                      !!(mint.mintInfo.contact && mint.mintInfo.contact.length > 0) ||
                      !!mint.mintInfo.motd
                    }
                  />
                )}
                {mint.mintInfo.description_long && (
                  <InfoRow
                    label="Details"
                    value={mint.mintInfo.description_long}
                    hasSeparator={
                      !!(mint.mintInfo.contact && mint.mintInfo.contact.length > 0) ||
                      !!mint.mintInfo.motd
                    }
                  />
                )}
                {mint.mintInfo.contact && mint.mintInfo.contact.length > 0 && (
                  <>
                    {mint.mintInfo.contact.map((contact, index) => {
                      const isLast = index === mint.mintInfo.contact!.length - 1;
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
                {mint.mintInfo.motd && <InfoRow label="Message" value={mint.mintInfo.motd} />}
              </View>
            </View>
          )}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Txt
            txt={t("dangerZone", { ns: NS.mints })}
            styles={[styles.sectionTitle, { color: theme.error }]}
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
                onConfirm: handleMintDelete,
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
  const theme = useAppThemeTokens();
  return (
    <>
      <View style={styles.infoRow}>
        <Txt txt={label} styles={[styles.infoLabel, { color: theme.textSecondary }]} />
        <Txt txt={value} styles={[styles.infoValue, { color: theme.text }]} />
      </View>
      {hasSeparator && <View style={[styles.infoSeparator, { backgroundColor: theme.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mintIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  mintName: {
    fontSize: fontScale(20),
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  mintVersion: {
    fontSize: fontScale(13),
    fontWeight: "500",
    opacity: 0.7,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  balanceText: {
    fontSize: fontScale(18),
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontScale(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  urlText: {
    fontSize: fontScale(14),
    fontWeight: "500",
    lineHeight: verticalScale(20),
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: fontScale(12),
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: fontScale(14),
    fontWeight: "400",
    lineHeight: verticalScale(20),
  },
  infoSeparator: {
    height: 1,
    marginVertical: 12,
    opacity: 0.2,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  deleteButtonText: {
    fontSize: fontScale(15),
    fontWeight: "600",
  },
});
