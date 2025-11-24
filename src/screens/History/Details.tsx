import Copy from "@comps/Copy";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { THistoryEntryPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl, formatSatStr } from "@util";
import { getEncodedToken } from "@cashu/cashu-ts";

const truncateStr = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

export default function HistoryEntryDetails({
  navigation,
  route,
}: THistoryEntryPageProps) {
  const { entry } = route.params;
  const { t } = useTranslation([NS.history]);
  const { color } = useThemeContext();

  const getEntryAmount = () => {
    switch (entry.type) {
      case "receive":
        return `+${formatSatStr(entry.amount)}`;
      case "send":
        return `-${formatSatStr(entry.amount)}`;
      case "melt":
        return `-${formatSatStr(entry.amount)}`;
      case "mint":
        return `+${formatSatStr(entry.amount)}`;
    }
  };

  const getEntryAmountColor = () => {
    switch (entry.type) {
      case "receive":
        return mainColors.VALID;
      case "send":
        return mainColors.ERROR;
      case "melt":
        return mainColors.ZAP;
      case "mint":
        return mainColors.VALID;
    }
  };

  const getEntryType = () => {
    switch (entry.type) {
      case "receive":
        return t("receive");
      case "send":
        return t("send");
      case "melt":
        return t("melt");
      case "mint":
        return t("mint", { ns: NS.common });
    }
  };

  const getEntryDescription = () => {
    switch (entry.type) {
      case "receive":
        return t("receivedEcash");
      case "send":
        return t("sentEcash");
      case "melt":
        return t("paidInvoice");
      case "mint":
        if (entry.state === "UNPAID") {
          return t("awaitingPayment", { ns: NS.common });
        }
        return t("receivedFromMint", { ns: NS.common });
    }
  };

  const getTokenValue = (): string | null => {
    if (entry.type === "send" && entry.token) {
      return getEncodedToken(entry.token);
    }
    if (entry.type === "mint" && entry.paymentRequest) {
      return entry.paymentRequest;
    }
    return null;
  };

  const getState = () => {
    if (entry.type === "mint") {
      return entry.state;
    }
    if (entry.type === "melt") {
      return entry.state;
    }
    return null;
  };

  return (
    <Screen
      screenName={t("details")}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.overview}>
          <Txt
            txt={getEntryAmount()}
            styles={[styles.amount, { color: getEntryAmountColor() }]}
          />
          <Txt
            txt={getEntryType()}
            styles={[styles.type, { color: color.TEXT_SECONDARY }]}
          />
          <Txt
            txt={getEntryDescription()}
            styles={[styles.description, { color: color.TEXT_SECONDARY }]}
          />
        </View>
        <Separator style={[styles.separator]} />
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Txt
              txt={t("date")}
              styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
            />
            <Txt
              txt={new Date(entry.createdAt).toLocaleString()}
              styles={[styles.detailValue, { color: color.TEXT }]}
            />
          </View>
          <View style={styles.detailRow}>
            <Txt
              txt={t("amount")}
              styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
            />
            <Txt
              txt={formatSatStr(entry.amount)}
              styles={[styles.detailValue, { color: color.TEXT }]}
            />
          </View>
          {getState() && (
            <View style={styles.detailRow}>
              <Txt
                txt={t("status", { ns: NS.common })}
                styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
              />
              <Txt
                txt={getState() ?? ""}
                styles={[styles.detailValue, { color: color.TEXT }]}
              />
            </View>
          )}
          <View style={styles.detailRow}>
            <Txt
              txt={t("mint", { ns: NS.common })}
              styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
            />
            <Txt
              txt={formatMintUrl(entry.mintUrl)}
              styles={[styles.detailValue, { color: color.TEXT }]}
            />
          </View>
          {entry.unit && (
            <View style={styles.detailRow}>
              <Txt
                txt={t("unit", { ns: NS.common })}
                styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
              />
              <Txt
                txt={entry.unit}
                styles={[styles.detailValue, { color: color.TEXT }]}
              />
            </View>
          )}
          {(entry.type === "mint" || entry.type === "melt") && (
            <View style={styles.detailRow}>
              <Txt
                txt={t("quoteId", { ns: NS.common })}
                styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]}
              />
              <Txt
                txt={truncateStr(entry.quoteId, 20)}
                styles={[styles.detailValue, { color: color.TEXT }]}
              />
            </View>
          )}
        </View>
        {getTokenValue() && (
          <>
            <Separator style={[styles.separator]} />
            <View style={styles.tokenSection}>
              <View style={styles.tokenHeader}>
                <Txt
                  txt={
                    entry.type === "mint"
                      ? t("invoice", { ns: NS.common })
                      : t("token")
                  }
                  styles={[styles.sectionTitle, { color: color.TEXT }]}
                />
                <Copy txt={getTokenValue() ?? ""} />
              </View>
              <View
                style={[
                  styles.tokenContainer,
                  { backgroundColor: color.INPUT_BG },
                ]}
              >
                <Txt
                  txt={truncateStr(getTokenValue() ?? "", 100)}
                  styles={[styles.tokenValue, { color: color.TEXT_SECONDARY }]}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  overview: {
    alignItems: "center",
    paddingVertical: "20@vs",
    paddingHorizontal: "15@s",
  },
  overviewIcon: {
    width: "60@s",
    height: "60@s",
    borderRadius: "30@s",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "10@vs",
  },
  amount: {
    fontSize: "40@vs",
    fontWeight: "600",
  },
  type: {
    fontSize: "14@vs",
    marginTop: "5@vs",
  },
  description: {
    fontSize: "14@vs",
    marginTop: "5@vs",
    textAlign: "center",
  },
  separator: {
    marginVertical: "10@vs",
  },
  details: {
    paddingHorizontal: "15@s",
    paddingBottom: "15@vs",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: "10@vs",
  },
  detailLabel: {
    fontSize: "14@vs",
  },
  detailValue: {
    fontSize: "14@vs",
  },
  mints: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tokenSection: {
    paddingHorizontal: "15@s",
    paddingBottom: "15@vs",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10@vs",
  },
  sectionTitle: {
    fontSize: "16@vs",
    fontWeight: "600",
  },
  tokenValue: {
    fontSize: "14@vs",
  },
  tokenContainer: {
    padding: "10@s",
    borderRadius: "8@s",
  },
  actionSection: {
    paddingHorizontal: "15@s",
    paddingBottom: "15@vs",
  },
  actionButton: {
    paddingVertical: "10@vs",
    paddingHorizontal: "15@s",
    borderRadius: "8@s",
    alignItems: "center",
    justifyContent: "center",
  },
});
