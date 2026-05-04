import Screen from "@comps/Screen";
import { useTrustedMints } from "@cashu/coco-react";
import { l } from "@log";
import ConfirmBottomSheet, { ConfirmBottomSheetRef } from "@comps/modal/ConfirmBottomSheet";
import { useKnownMints } from "@src/context/KnownMints";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { AppText, verticalScale, fontScale, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl } from "@util";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
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
        <Stack style={[styles.headerCard, { backgroundColor: theme.inputBackground }]}>
          <Stack style={styles.headerContent}>
            {mint?.mintInfo?.icon_url && (
              <Image
                source={{ uri: mint.mintInfo.icon_url }}
                style={[styles.mintIcon, { backgroundColor: theme.mintIconBackground }]}
                contentFit="cover"
                transition={200}
              />
            )}
            <Stack style={styles.headerTextContainer}>
              {mint?.mintInfo?.name && (
                <AppText
                  style={[styles.mintName, { color: theme.text }]}
                  testID={`${mint.mintInfo.name}-txt`}
                >
                  {mint.mintInfo.name}
                </AppText>
              )}
              {mint?.mintInfo?.version && (
                <AppText
                  style={[styles.mintVersion, { color: theme.textSecondary }]}
                  testID={`${`Version ${mint.mintInfo.version}`}-txt`}
                >{`Version ${mint.mintInfo.version}`}</AppText>
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* Mint URL Section */}
        <Stack style={styles.section}>
          <AppText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
            testID={`${t("general", { ns: NS.mints })}-txt`}
          >
            {t("general", { ns: NS.mints })}
          </AppText>
          <Stack style={[styles.card, { backgroundColor: theme.inputBackground }]}>
            <AppText
              style={[styles.urlText, { color: theme.text }]}
              testID={`${formatMintUrl(route.params.mintUrl)}-txt`}
            >
              {formatMintUrl(route.params.mintUrl)}
            </AppText>
          </Stack>
        </Stack>

        {/* Metadata Section */}
        {mint?.mintInfo &&
          (mint.mintInfo.description ||
            mint.mintInfo.description_long ||
            (mint.mintInfo.contact && mint.mintInfo.contact.length > 0) ||
            mint.mintInfo.motd) && (
            <Stack style={styles.section}>
              <AppText
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
                testID={`${t("metadata", { ns: NS.mints })}-txt`}
              >
                {t("metadata", { ns: NS.mints })}
              </AppText>
              <Stack style={[styles.card, { backgroundColor: theme.inputBackground }]}>
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
              </Stack>
            </Stack>
          )}

        {/* Danger Zone */}
        <Stack style={styles.section}>
          <AppText
            style={[styles.sectionTitle, { color: theme.error }]}
            testID={`${t("dangerZone", { ns: NS.mints })}-txt`}
          >
            {t("dangerZone", { ns: NS.mints })}
          </AppText>
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
        </Stack>
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
      <Stack style={styles.infoRow}>
        <AppText style={[styles.infoLabel, { color: theme.textSecondary }]} testID={`${label}-txt`}>
          {label}
        </AppText>
        <AppText style={[styles.infoValue, { color: theme.text }]} testID={`${value}-txt`}>
          {value}
        </AppText>
      </Stack>
      {hasSeparator && <Stack style={[styles.infoSeparator, { backgroundColor: theme.border }]} />}
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
