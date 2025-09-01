import { CashuWallet, getDecodedToken, getEncodedToken } from "@cashu/cashu-ts";
import Button from "@comps/Button";
import useCopy from "@comps/hooks/Copy";
import { useCheckSpent } from "@comps/hooks/Spent";
import { CopyIcon, ShareIcon } from "@comps/Icons";
import QR from "@comps/QR";
import Txt from "@comps/Txt";
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from "@model/nav";
import TopNav from "@nav/TopNav";
import { preventBack } from "@nav/utils";
import { isIOS } from "@src/consts";
import { useBalanceContext } from "@src/context/Balance";
import { useHistoryContext } from "@src/context/History";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { l } from "@src/logger";
import { proofEvents } from "@src/util/events";
import { sumProofsValue } from "@src/wallet/proofs";
import { walletService } from "@src/services/WalletService";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { globals, highlight as hi, mainColors } from "@styles";
import { formatInt, formatSatStr, share, vib } from "@util";
import { isTokenSpendable } from "@wallet";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({
  navigation,
  route,
}: TEncodedTokenPageProps) {
  const { token } = route.params || {};
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const [error, setError] = useState({ msg: "", open: false });
  const spent = useCheckSpent(token);
  const encodedToken = useMemo(() => getEncodedToken(token), [token]);
  const tokenAmount = useMemo(() => sumProofsValue(token.proofs), [token]);
  const { copied, copy } = useCopy();

  // prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
  useEffect(() => {
    const backHandler = (e: TBeforeRemoveEvent) =>
      preventBack(e, navigation.dispatch);
    navigation.addListener("beforeRemove", backHandler);
    return () => navigation.removeListener("beforeRemove", backHandler);
  }, [navigation]);

  return (
    <View
      style={[
        globals(color).container,
        styles.container,
        { paddingBottom: isIOS ? vs(50) : vs(20) },
      ]}
    >
      {!spent && (
        <TopNav
          withBackBtn
          screenName={`${t("newToken")}  🥜🐿️`}
          handlePress={() => navigation.navigate("dashboard")}
        />
      )}
      {spent ? (
        <>
          <View />
          <View>
            <Text style={[styles.successTxt, { color: color.TEXT }]}>
              {t("isSpent", { ns: NS.history })}
            </Text>
            <View style={styles.successAnim}>
              <LottieView
                source={require("../../../../assets/lottie/success.json")}
                autoPlay
                loop={false}
                style={styles.lottie}
                renderMode="HARDWARE"
              />
            </View>
          </View>
          <Button
            txt={t("backToDashboard")}
            onPress={() => navigation.navigate("dashboard")}
          />
        </>
      ) : (
        <>
          {/* The amount of the created token */}
          <View style={styles.qrWrap}>
            <Txt
              txt={formatInt(tokenAmount)}
              styles={[styles.tokenAmount, { color: hi[highlight] }]}
            />
            <Txt
              txt={formatSatStr(tokenAmount, "standard", false)}
              styles={[styles.tokenFormat]}
            />
            {/* The QR code */}
            {error.open ? (
              <Txt
                txt={error.msg}
                styles={[globals(color).navTxt, styles.errorMsg]}
              />
            ) : (
              <QR
                size={s(280)}
                value={encodedToken}
                onError={() =>
                  setTimeout(
                    () =>
                      setError({
                        msg: t("bigQrMsg"),
                        open: true,
                      }),
                    0
                  )
                }
              />
            )}
          </View>
          <View style={styles.fullWidth}>
            {error.open && (
              <>
                <Button
                  txt={t(copied ? "copied" : "copyToken")}
                  onPress={() => void copy(encodedToken)}
                  icon={
                    <CopyIcon
                      width={s(18)}
                      height={s(18)}
                      color={mainColors.WHITE}
                    />
                  }
                />
                <View style={{ marginVertical: vs(10) }} />
              </>
            )}
            <Button
              outlined
              txt={t("share")}
              onPress={() =>
                void share(encodedToken, `cashu://${encodedToken}`)
              }
              icon={
                <ShareIcon width={s(18)} height={s(18)} color={hi[highlight]} />
              }
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingTop: 0,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "20@s",
  },
  qrWrap: {
    alignItems: "center",
    marginTop: "70@vs",
  },
  tokenAmount: {
    fontSize: "40@vs",
    fontWeight: "500",
    marginTop: "20@vs",
  },
  tokenFormat: {
    marginBottom: "15@vs",
  },
  errorMsg: {
    marginVertical: "25@vs",
    textAlign: "center",
  },
  successTxt: {
    fontSize: "28@vs",
    fontWeight: "800",
    textAlign: "center",
    marginTop: "30@vs",
  },
  successAnim: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20@vs",
  },
  fullWidth: {
    width: "100%",
  },
  lottie: {
    width: "100@s",
    height: "100@s",
  },
});
