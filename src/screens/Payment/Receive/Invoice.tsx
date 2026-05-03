import Button from "@comps/Button";
import { ShareIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import QR from "@comps/QR";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import { l } from "@log";
import type { TMintInvoicePageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { useFocusEffect } from "@react-navigation/native";
import { useManager } from "@src/context/Manager";
import { NS } from "@src/i18n";
import { fontScale, globals, useAppThemeTokens } from "@styles";
import { formatMintUrl, share } from "@util";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
  const { operation } = route.params;
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const manager = useManager();

  useFocusEffect(
    useCallback(() => {
      const handlePaidInvoice = ({
        operation: finalizedOperation,
      }: {
        operation: { id: string };
      }) => {
        if (finalizedOperation.id !== operation.id) {
          return;
        }

        navigation.navigate("successScreen", {
          type: "receive",
          amount: operation.amount,
        });
      };

      manager.on("mint-op:finalized", handlePaidInvoice);
      return () => manager.off("mint-op:finalized", handlePaidInvoice);
    }, [manager, navigation, operation.amount, operation.id]),
  );

  return (
    <Screen
      screenName={t("payInvoice", { ns: NS.wallet })}
      withCancelBtn
      handleCancel={() => {
        console.log("handleCancel");
        navigation.navigate("dashboard");
      }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <QR
            size={250}
            value={operation.request}
            onError={() => l("Error while generating the LN QR code")}
            isInvoice
            animate={false}
          />
          <View>
            <View style={styles.awaitingWrap}>
              <Txt
                txt={t("paymentPending") + "..."}
                styles={[{ fontWeight: "500", marginRight: 10 }]}
              />
              <Loading />
            </View>
          </View>
          <Button
            txt={t("shareInvoice")}
            onPress={() => void share(operation.request)}
            icon={<ShareIcon color={theme.accentContrast} />}
            outlined
          />
          {isIOS && <View style={styles.placeholder} />}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  lnExpiry: {
    fontSize: fontScale(34),
    fontWeight: "600",
    textAlign: "center",
  },
  awaitingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  placeholder: {
    height: 20,
  },
});
