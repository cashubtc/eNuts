import type { GetInfoResponse } from "@cashu/cashu-ts";
import Empty from "@comps/Empty";
import useLoading from "@comps/hooks/Loading";
import { ExclamationIcon, MintBoardIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import type { TMintInfoPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi, mainColors } from "@styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function MintInfoPage({
  navigation,
  route,
}: TMintInfoPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<GetInfoResponse>();
  const { loading, startLoading, stopLoading } = useLoading();

  return (
    <Screen
      withBackBtn
      screenName={t("mintInfo", { ns: NS.mints })}
      handlePress={() => navigation.goBack()}
    >
      {info ? (
        <ScrollView
          style={{ marginBottom: isIOS ? insets.bottom : 0 }}
          alwaysBounceVertical={false}
        >
          {/* Name, Version & short description */}
          <View style={[globals(color).wrapContainer, styles.mainInfo]}>
            <View
              style={[
                styles.circleContainer,
                { backgroundColor: color.INPUT_BG, borderColor: color.BORDER },
              ]}
            >
              <Text style={[styles.mintIcon, { color: color.TEXT }]}>
                <MintBoardIcon
                  width={s(30)}
                  height={s(28)}
                  color={hi[highlight]}
                />
              </Text>
            </View>
            <Txt txt={info.name} bold styles={[styles.mintName]} />
            <Txt
              txt={`${t("version")}: ${info.version}`}
              bold
              styles={[styles.mintVersion]}
            />
            {info.description && info.description.length > 0 && (
              <Txt txt={info.description} bold styles={[styles.mintVersion]} />
            )}
          </View>
          {/* Message of the day - important announcements */}
          {!!info.motd && (
            <View style={[globals(color).wrapContainer, styles.infoEntry]}>
              <View style={styles.motd}>
                <View>
                  <Txt
                    txt={t("importantNotice", { ns: NS.mints })}
                    bold
                    styles={[styles.description]}
                  />
                  <Txt txt={info.motd} />
                </View>
                <ExclamationIcon color={mainColors.ERROR} />
              </View>
            </View>
          )}
          {/* Contact, Supported NUTs, Public Key */}
          <View style={[globals(color).wrapContainer, styles.infoEntry]}>
            <Txt
              txt={t("contact", { count: 1 })}
              bold
              styles={[styles.description]}
            />
            {info.contact?.map((c, i) => (
              <View key={i} style={styles.contactWrap}>
                {c[0].length > 0 && c[1].length > 0 ? (
                  <>
                    <Txt txt={c[0]} />
                    <Txt txt={c[1]} />
                  </>
                ) : (
                  <Txt txt={t("mintNoContact", { ns: NS.mints })} />
                )}
              </View>
            ))}
            <Separator style={[{ marginVertical: vs(20) }]} />
            <Txt
              txt={t("supportedNuts", { ns: NS.mints })}
              bold
              styles={[styles.description]}
            />
            {info.nuts?.map((n, i) => (
              <Txt key={i} txt={n} />
            ))}
            <Separator style={[{ marginVertical: vs(20) }]} />
            <Txt
              txt={t("pubKey", { ns: NS.mints })}
              bold
              styles={[styles.description]}
            />
            <Txt txt={info.pubkey} />
          </View>
          {/* Long description */}
          <View style={[globals(color).wrapContainer, styles.infoEntry]}>
            <Txt
              txt={t("additionalInfo", { ns: NS.mints })}
              bold
              styles={[styles.description]}
            />
            <Txt
              txt={info.description_long || t("noAdditional", { ns: NS.mints })}
            />
          </View>
        </ScrollView>
      ) : loading ? (
        <Loading />
      ) : (
        <Empty txt={t("noInfo", { ns: NS.mints }) + "..."} />
      )}
    </Screen>
  );
}

const styles = ScaledSheet.create({
  mainInfo: {
    padding: "20@s",
    alignItems: "center",
    marginTop: "50@vs",
    marginBottom: "20@vs",
  },
  circleContainer: {
    width: "90@s",
    height: "90@s",
    borderWidth: 1,
    borderRadius: "45@s",
    marginTop: "-70@vs",
    marginBottom: "15@vs",
    justifyContent: "center",
    alignItems: "center",
  },
  mintIcon: {
    fontSize: "34@vs",
    fontWeight: "300",
  },
  mintName: {
    fontSize: "24@vs",
  },
  mintVersion: {
    marginVertical: "10@vs",
  },
  infoEntry: {
    paddingBottom: "20@vs",
  },
  description: {
    fontSize: "12@vs",
    marginBottom: "5@vs",
  },
  contactWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  motd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
