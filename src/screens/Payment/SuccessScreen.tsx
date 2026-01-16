import Button from "@comps/Button";
import Logo from "@comps/Logo";
import Txt from "@comps/Txt";
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
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { isNum, vib } from "@util";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet, vs } from "react-native-size-matters";

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
    <View style={styles.detailsRow}>
      <Txt txt={label} styles={[styles.detailsTxt]} />
      <Txt txt={value} styles={[styles.detailsTxt]} />
    </View>
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
    <View style={styles.detailsWrap}>
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SuccessScreen({ navigation, route }: TSuccessScreenProps) {
  const config = route.params;
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
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
      <View pointerEvents="none" style={styles.confetti}>
        <LottieView
          source={require("../../../assets/lottie/confetti.json")}
          autoPlay
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Txt txt={title} bold center styles={[styles.title]} />

        {/* Memo */}
        {config.memo && (
          <Txt
            txt={config.memo}
            center
            styles={[styles.subtitle, { color: color.TEXT_SECONDARY }]}
          />
        )}

        {/* Mint */}
        {config.mint && config.mint.length > 0 && (
          <Txt
            txt={config.mint}
            center
            styles={[styles.subtitle, { color: color.TEXT_SECONDARY }]}
          />
        )}

        {/* Amount Display (for simple success types) */}
        {hasSimpleAmount(config) && (
          <View style={styles.amountWrap}>
            <Txt txt={formatAmount(config.amount).formatted} bold center styles={[styles.amount]} />
            <Txt
              txt={formatAmount(config.amount).symbol}
              center
              styles={[styles.amountSymbol, { color: color.TEXT_SECONDARY }]}
            />
          </View>
        )}

        {/* Payment Details (for melt/autoSwap) */}
        {hasPaymentDetails(config) && (
          <PaymentDetails config={config} formatAmount={formatAmount} />
        )}
      </View>

      {/* Back to Dashboard Button */}
      <View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
        <Button txt={t("backToDashboard")} onPress={() => navigation.navigate("dashboard")} />
      </View>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: "20@s",
  },
  logo: {
    marginTop: "90@s",
    height: "90@s",
    opacity: 0.8,
  },
  content: {
    width: "100%",
  },
  title: {
    fontSize: "28@vs",
    marginTop: "30@vs",
  },
  amountWrap: {
    alignItems: "center",
    marginTop: "20@vs",
  },
  amount: {
    fontSize: "42@s",
  },
  amountSymbol: {
    fontSize: "14@vs",
    marginTop: "4@vs",
  },
  subtitle: {
    marginTop: "20@vs",
    fontSize: "14@vs",
    fontWeight: "500",
  },
  detailsWrap: {
    width: "100%",
    marginTop: "20@vs",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10@vs",
  },
  detailsTxt: {
    fontWeight: "500",
  },
  btnWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    paddingHorizontal: "20@s",
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
    marginTop: "20@vs",
  },
  lottie: {
    width: "100@s",
    height: "100@s",
  },
});
