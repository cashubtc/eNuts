import Button from "@comps/Button";
import { ShareIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import QR from "@comps/QR";
import Txt from "@comps/Txt";
import { _testmintUrl, isIOS } from "@consts";
import { l } from "@log";
import type { TMintInvoicePageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { useManager } from "@src/context/Manager";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { getColor } from "@styles/colors";
import { formatMintUrl, share } from "@util";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export default function InvoiceScreen({
  navigation,
  route,
}: TMintInvoicePageProps) {
  const { mintUrl, quote } = route.params;
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const manager = useManager();

  const handlePaidInvoice = async () => {
    navigation.navigate("success", {
      amount: quote.amount,
      mint: formatMintUrl(mintUrl),
    });
  };

  useEffect(() => {
    manager.subscription.awaitMintQuotePaid(mintUrl, quote.quote).then(() => {
      handlePaidInvoice();
    });
  }, []);

  return (
    <View style={[globals(color).container, styles.container]}>
      <TopNav
        screenName={t("payInvoice", { ns: NS.wallet })}
        txt={t("cancel")}
        handlePress={() => {
          navigation.navigate("dashboard");
        }}
      />
      <View style={styles.content}>
        <QR
          size={vs(250)}
          value={quote.request}
          onError={() => l("Error while generating the LN QR code")}
          isInvoice
          animate={false}
        />
        <View>
          {mintUrl === _testmintUrl && (
            <View style={{ marginTop: vs(20) }}>
              <Loading />
            </View>
          )}
          <View style={styles.awaitingWrap}>
            <Txt
              txt={t("paymentPending") + "..."}
              styles={[{ fontWeight: "500", marginRight: s(10) }]}
            />
            <Loading />
          </View>
        </View>
        <Button
          txt={t("shareInvoice")}
          onPress={() => void share(quote.request)}
          icon={<ShareIcon color={getColor(highlight, color)} />}
          outlined
        />
        {isIOS && <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@s",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  lnExpiry: {
    fontSize: "34@vs",
    fontWeight: "600",
    textAlign: "center",
  },
  awaitingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "5@vs",
  },
  placeholder: {
    height: "20@vs",
  },
});
