import Button from "@comps/Button";
import { ShareIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import QR from "@comps/QR";
import { isIOS } from "@consts";
import { l } from "@log";
import type { TMintInvoicePageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { useFocusEffect } from "@react-navigation/native";
import { useManager } from "@src/context/Manager";
import { NS } from "@src/i18n";
import { AppText, fontScale, globals, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl, share } from "@util";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions } from "react-native";

const QR_HORIZONTAL_CHROME = 20;
const QR_VERTICAL_CHROME = 82;
const MIN_QR_SIZE = 140;

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
  const { operation } = route.params;
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const manager = useManager();
  const { width, height } = useWindowDimensions();
  const [qrStageSize, setQrStageSize] = useState({ width: 0, height: 0 });
  const qrSize = useMemo(() => {
    if (!qrStageSize.width || !qrStageSize.height) {
      return Math.round(Math.max(196, Math.min(300, width - 96, height * 0.38)));
    }

    return Math.max(
      MIN_QR_SIZE,
      Math.floor(
        Math.min(qrStageSize.width - QR_HORIZONTAL_CHROME, qrStageSize.height - QR_VERTICAL_CHROME),
      ),
    );
  }, [height, qrStageSize.height, qrStageSize.width, width]);

  useFocusEffect(
    useCallback(() => {
      const handlePaidInvoice = ({
        operation: finalizedOperation,
      }: {
        operation: {
          id: string;
        };
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
      <Stack style={styles.container}>
        <Stack style={styles.content}>
          <Stack
            style={styles.qrStage}
            onLayout={(event) => setQrStageSize(event.nativeEvent.layout)}
          >
            <QR
              size={qrSize}
              value={operation.request}
              onError={() => l("Error while generating the LN QR code")}
              isInvoice
              animate={false}
            />
          </Stack>
          <Stack>
            <Stack style={styles.awaitingWrap}>
              <AppText
                style={[{ fontWeight: "500", marginRight: 10 }]}
                testID={`${t("paymentPending") + "..."}-txt`}
              >
                {t("paymentPending") + "..."}
              </AppText>
              <Loading />
            </Stack>
          </Stack>
          <Button
            txt={t("shareInvoice")}
            onPress={() => void share(operation.request)}
            icon={<ShareIcon color={theme.accentContrast} />}
            outlined
          />
          {isIOS && <Stack style={styles.placeholder} />}
        </Stack>
      </Stack>
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
  qrStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    width: "100%",
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
