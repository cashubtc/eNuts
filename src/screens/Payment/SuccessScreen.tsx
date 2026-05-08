import { AppText, appFontSize, useAppThemeTokens, Stack } from "@styles";
import Button from "@comps/Button";
import Logo from "@comps/Logo";
import Screen from "@comps/Screen";
import { isIOS } from "@consts";
import type {
  TBeforeRemoveEvent,
  TSuccessScreenProps,
  SuccessConfig,
  MeltSuccessConfig,
  AutoSwapSuccessConfig,
} from "@model/nav";
import { preventBack } from "@nav/utils";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { isNum, vib } from "@util";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────
function hasPaymentDetails(
  config: SuccessConfig,
): config is MeltSuccessConfig | AutoSwapSuccessConfig {
  return config.type === "melt" || config.type === "autoSwap";
}
function hasSimpleAmount(config: SuccessConfig): boolean {
  return (
    config.type === "receive" ||
    config.type === "claim" ||
    config.type === "send" ||
    config.type === "restore" ||
    config.type === "zap"
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────
function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack style={styles.detailsRow}>
      <AppText style={[styles.detailsTxt]} testID={`${label}-txt`}>
        {label}
      </AppText>
      <AppText style={[styles.detailsTxt]} testID={`${value}-txt`}>
        {value}
      </AppText>
    </Stack>
  );
}
interface PaymentDetailsProps {
  config: MeltSuccessConfig | AutoSwapSuccessConfig;
  formatAmount: ReturnType<typeof useCurrencyContext>["formatAmount"];
}
function PaymentDetails({ config, formatAmount }: PaymentDetailsProps) {
  const { t } = useTranslation([NS.common]);
  const { amount, fee, change } = config;
  const isSwap = config.type === "autoSwap";
  return (
    <Stack style={styles.detailsWrap}>
      <DetailsRow
        label={t(isSwap ? "swapped" : "paidOut", { ns: NS.wallet })}
        value={`${formatAmount(amount).formatted} ${formatAmount(amount).symbol}`}
      />
      <DetailsRow
        label={t("fee")}
        value={`${formatAmount(fee).formatted} ${formatAmount(fee).symbol}`}
      />
      <DetailsRow
        label={t("totalInclFee")}
        value={`${formatAmount(amount + fee).formatted} ${formatAmount(amount + fee).symbol}`}
      />
      {isNum(change) && (
        <DetailsRow
          label={t("change")}
          value={`${formatAmount(change).formatted} ${formatAmount(change).symbol}`}
        />
      )}
    </Stack>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SuccessScreen({ navigation, route }: TSuccessScreenProps) {
  const config = route.params;
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { formatAmount } = useCurrencyContext();
  const insets = useSafeAreaInsets();
  const getSuccessTitle = (cfg: SuccessConfig): string => {
    switch (cfg.type) {
      case "melt":
        return t("paymentSuccess");
      case "autoSwap":
        return t("autoSwapSuccess");
      case "claim":
        return t("receivedEcash", { ns: NS.history });
      case "receive":
        return t("receivedFromMint");
      case "zap":
        return t("paymentSuccess");
      case "restore":
        return "Wallet restored!";
      case "send":
        return t("ecashCreated", {
          ns: NS.common,
          defaultValue: "Ecash created!",
        });
    }
  };
  const title = getSuccessTitle(config);
  // Vibrate on mount
  useEffect(() => {
    vib(400);
  }, []);
  // Prevent back navigation
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);
  return (
    <Screen>
      {/* Confetti Animation */}
      <Stack pointerEvents="none" style={styles.confetti}>
        <LottieView
          source={require("../../../assets/lottie/confetti.json")}
          autoPlay
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      </Stack>

      {/* Content */}
      <Stack style={styles.content}>
        {/* Title */}
        <AppText style={[styles.title]} weight="medium" align="center" testID={`${title}-txt`}>
          {title}
        </AppText>

        {/* Memo */}
        {config.memo && (
          <AppText
            style={[styles.subtitle, { color: theme.textSecondary }]}
            align="center"
            testID={`${config.memo}-txt`}
          >
            {config.memo}
          </AppText>
        )}

        {/* Mint */}
        {config.mint && config.mint.length > 0 && (
          <AppText
            style={[styles.subtitle, { color: theme.textSecondary }]}
            align="center"
            testID={`${config.mint}-txt`}
          >
            {config.mint}
          </AppText>
        )}

        {/* Amount Display (for simple success types) */}
        {hasSimpleAmount(config) && (
          <Stack style={styles.amountWrap}>
            <AppText
              style={[styles.amount]}
              weight="medium"
              align="center"
              testID={`${formatAmount(config.amount).formatted}-txt`}
            >
              {formatAmount(config.amount).formatted}
            </AppText>
            <AppText
              style={[styles.amountSymbol, { color: theme.textSecondary }]}
              align="center"
              testID={`${formatAmount(config.amount).symbol}-txt`}
            >
              {formatAmount(config.amount).symbol}
            </AppText>
          </Stack>
        )}

        {/* Payment Details (for melt/autoSwap) */}
        {hasPaymentDetails(config) && (
          <PaymentDetails config={config} formatAmount={formatAmount} />
        )}
      </Stack>

      {/* Back to Dashboard Button */}
      <Stack style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
        <Button txt={t("backToDashboard")} onPress={() => navigation.navigate("dashboard")} />
      </Stack>
    </Screen>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logo: {
    marginTop: 90,
    height: 90,
    opacity: 0.8,
  },
  content: {
    width: "100%",
  },
  title: {
    fontSize: appFontSize.display,
    marginTop: 30,
  },
  amountWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  amount: {
    fontSize: appFontSize.balance,
  },
  amountSymbol: {
    fontSize: appFontSize.body,
    marginTop: 4,
  },
  subtitle: {
    marginTop: 20,
    fontSize: appFontSize.body,
    fontWeight: "500",
  },
  detailsWrap: {
    width: "100%",
    marginTop: 20,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailsTxt: {
    fontWeight: "500",
  },
  btnWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    paddingHorizontal: 20,
  },
  confetti: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  successAnim: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
