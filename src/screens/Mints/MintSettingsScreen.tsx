import useCopy from "@comps/hooks/Copy";
import {
  BitcoinIcon,
  CheckmarkIcon,
  ChevronRightIcon,
  CopyIcon,
  TrashbinIcon,
  ValidateIcon,
} from "@comps/Icons";
import MetadataItem from "./components/MetadataItem";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";

import { _testmintUrl, isIOS } from "@consts";
import { l } from "@log";
import { BottomModal } from "@modal/Question";
import TopNav from "@nav/TopNav";
import { useKnownMints } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { MintSettingsScreenProps } from "@src/nav/navTypes";

import { globals, mainColors } from "@styles";
import { formatMintUrl, formatSatStr } from "@util";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";
import { Image } from "expo-image";

export default function MintSettingsScreen({
  navigation,
  route,
}: MintSettingsScreenProps) {
  const { t } = useTranslation([NS.common]);
  // prompt modal
  const { openPromptAutoClose } = usePromptContext();
  const { color } = useThemeContext();
  const { hidden } = usePrivacyContext();
  // check proofs confirmation
  const [checkProofsOpen, setCheckProofsOpen] = useState(false);
  // delete mint prompt
  const [delMintModalOpen, setDelMintModalOpen] = useState(false);

  const { copied, copy } = useCopy();

  // Track which field was copied for better UX
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    await copy(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { knownMints } = useKnownMints();
  const mint = knownMints.find((m) => m.mintUrl === route.params.mintUrl);
  console.log("mint", mint);

  const handleMintDelete = () => {
    void (async () => {
      try {
        //TODO: Add delete
        navigation.goBack();
      } catch (e) {
        l(e);
      }
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
      <TopNav
        screenName={t("mintSettings", { ns: NS.topNav })}
        withBackBtn
        handlePress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Mint Header */}
          <View style={styles.mintHeader}>
            <View style={styles.mintInfoContainer}>
              {mint?.mintInfo?.name && (
                <Txt
                  txt={mint.mintInfo.name}
                  styles={[styles.mintName, { color: color.TEXT }]}
                />
              )}
              {mint?.mintInfo?.version && (
                <Txt
                  txt={mint.mintInfo.version}
                  styles={[styles.mintVersion, { color: color.TEXT_SECONDARY }]}
                />
              )}
            </View>
            {mint?.mintInfo?.icon_url && (
              <Image
                source={{ uri: mint.mintInfo.icon_url }}
                style={styles.mintIcon}
                contentFit="cover"
                transition={200}
              />
            )}
          </View>
          {/* General */}
          <Txt
            txt={t("general", { ns: NS.mints })}
            styles={[styles.sectionHeader]}
          />
          <View style={globals(color).wrapContainer}>
            {/* Balance */}
            <View style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
              <View style={styles.mintOption}>
                <View style={{ minWidth: 30 }}>
                  <BitcoinIcon color={color.TEXT} />
                </View>
                <Txt txt={t("balance")} />
              </View>
              <Txt
                txt={hidden.balance ? "****" : formatSatStr(mint?.balance ?? 0)}
              />
            </View>
            <Separator style={[styles.separator]} />
            {/* Mint url */}
            <MintOption
              txt={formatMintUrl(route.params.mintUrl)}
              hasSeparator
              noChevron
              onPress={() => void handleCopy(route.params.mintUrl, "mintUrl")}
              icon={
                copiedField === "mintUrl" ? (
                  <CheckmarkIcon
                    width={s(20)}
                    height={s(20)}
                    color={mainColors.VALID}
                  />
                ) : (
                  <CopyIcon color={color.TEXT} />
                )
              }
            />
          </View>
          {/* Metadata */}
          {mint?.mintInfo && (
            <>
              <Txt
                txt={t("metadata", { ns: NS.mints })}
                styles={[styles.sectionHeader]}
              />
              <View style={globals(color).wrapContainer}>
                {/* Description */}
                {mint.mintInfo.description && (
                  <MetadataItem
                    text={mint.mintInfo.description}
                    hasSeparator={!!mint.mintInfo.description_long}
                  />
                )}
                {/* Long Description */}
                {mint.mintInfo.description_long && (
                  <MetadataItem
                    text={mint.mintInfo.description_long}
                    hasSeparator={
                      !!(
                        mint.mintInfo.contact &&
                        mint.mintInfo.contact.length > 0
                      ) || !!mint.mintInfo.motd
                    }
                  />
                )}
                {/* Contact Information */}
                {mint.mintInfo.contact && mint.mintInfo.contact.length > 0 && (
                  <>
                    {mint.mintInfo.contact.map((contact, index) => {
                      const isLast =
                        index === mint.mintInfo.contact!.length - 1;
                      const hasMotd = !!mint.mintInfo.motd;
                      const formatContactMethod = (method: string) => {
                        switch (method.toLowerCase()) {
                          case "email":
                            return "📧";
                          case "twitter":
                            return "🐦";
                          case "nostr":
                            return "⚡";
                          default:
                            return "📞";
                        }
                      };

                      return (
                        <MintOption
                          key={`${contact.method}-${index}`}
                          txt={`${formatContactMethod(contact.method)} ${
                            contact.info
                          }`}
                          hasSeparator={!isLast || hasMotd}
                          noChevron
                          onPress={() =>
                            void handleCopy(contact.info, `contact-${index}`)
                          }
                          icon={
                            copiedField === `contact-${index}` ? (
                              <CheckmarkIcon
                                width={s(20)}
                                height={s(20)}
                                color={mainColors.VALID}
                              />
                            ) : (
                              <CopyIcon color={color.TEXT} />
                            )
                          }
                        />
                      );
                    })}
                  </>
                )}
                {/* Message of the Day */}
                {mint.mintInfo.motd && (
                  <MetadataItem text={`💬 ${mint.mintInfo.motd}`} />
                )}
              </View>
            </>
          )}
          {/* Danger zone */}
          <Txt
            txt={t("dangerZone", { ns: NS.mints })}
            styles={[styles.sectionHeader]}
          />
          <View style={globals(color).wrapContainer}>
            {/* Check proofs */}
            <MintOption
              txt={t("checkProofs", { ns: NS.mints })}
              hasSeparator
              onPress={() => setCheckProofsOpen(true)}
              icon={
                <ValidateIcon
                  width={s(22)}
                  height={s(22)}
                  color={mainColors.WARN}
                />
              }
              rowColor={mainColors.WARN}
              noChevron
            />
            {/* Delete mint */}
            <MintOption
              txt={t("delMint", { ns: NS.mints })}
              onPress={() => {
                if (mint && mint.balance > 0) {
                  openPromptAutoClose({
                    msg: t("mintDelErr"),
                  });
                  return;
                }
                setDelMintModalOpen(true);
              }}
              icon={
                <TrashbinIcon
                  width={s(22)}
                  height={s(22)}
                  color={mainColors.ERROR}
                />
              }
              rowColor={mainColors.ERROR}
              noChevron
            />
          </View>
        </View>
      </ScrollView>
      {/* modal for deleting a mint */}
      {delMintModalOpen && (
        <BottomModal
          header={t("delMintSure", { ns: NS.mints })}
          txt={route.params.mintUrl}
          visible={delMintModalOpen}
          confirmFn={() => handleMintDelete()}
          cancelFn={() => setDelMintModalOpen(false)}
        />
      )}
    </View>
  );
}

interface IMintOption {
  txt: string;
  onPress: () => void;
  icon: React.ReactNode;
  rowColor?: string;
  hasSeparator?: boolean;
  noChevron?: boolean;
}

function MintOption({
  txt,
  onPress,
  icon,
  rowColor,
  hasSeparator,
  noChevron,
}: IMintOption) {
  const { color } = useThemeContext();
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={[globals().wrapRow, { paddingBottom: vs(15) }]}
      >
        <View style={styles.mintOption}>
          <View style={{ minWidth: s(30) }}>{icon}</View>
          <View style={styles.mintOptionText}>
            <Txt txt={txt} styles={[{ color: rowColor || color.TEXT }]} />
          </View>
        </View>
        {!noChevron ? <ChevronRightIcon color={color.TEXT} /> : <View />}
      </TouchableOpacity>
      {hasSeparator && <Separator style={[styles.separator]} />}
    </>
  );
}

const styles = ScaledSheet.create({
  scrollContainer: {
    marginTop: "90@vs",
    marginBottom: isIOS ? "20@vs" : "0@vs",
    padding: 8,
  },
  mintHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20@vs",
    marginTop: "10@vs",
    paddingHorizontal: "20@s",
  },
  mintInfoContainer: {
    flex: 1,
    marginRight: "15@s",
  },
  mintName: {
    fontSize: "20@vs",
    fontWeight: "600",
    marginBottom: "4@vs",
  },
  mintVersion: {
    fontSize: "14@vs",
    fontWeight: "400",
  },
  mintIcon: {
    width: "60@s",
    height: "60@s",
    borderRadius: "30@s",
    backgroundColor: "#f0f0f0",
  },
  mintUrl: {
    fontSize: "14@vs",
    marginRight: "10@s",
    fontWeight: "500",
  },
  sectionHeader: {
    fontWeight: "600",
    fontSize: "16@vs",
    paddingHorizontal: "20@s",
    marginTop: "20@vs",
    marginBottom: "12@vs",
    opacity: 0.9,
  },
  mintOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mintOptionText: {
    flex: 1,
    marginLeft: "10@s",
  },
  separator: {
    marginBottom: "15@vs",
  },
});
