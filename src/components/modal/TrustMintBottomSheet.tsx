import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { TxtButton } from "@comps/Button";
import { ReceiveIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Separator from "@comps/Separator";
import type { Token } from "@cashu/cashu-ts";
import type { ITokenInfo } from "@model";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { globals, useAppThemeTokens } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TrustMintAction = "trust" | "cancel" | "swap";

export type TrustMintBottomSheetRef = {
  open: (token: Token) => Promise<TrustMintAction>;
  close: () => void;
};

const TrustMintBottomSheet = forwardRef<TrustMintBottomSheetRef, { loading?: boolean }>(
  (_props, ref) => {
    const { t } = useTranslation([NS.common]);
    const theme = useAppThemeTokens();
    const { formatAmount } = useCurrencyContext();
    const insets = useSafeAreaInsets();

    const sheetRef = useRef<TrueSheet>(null);
    const [loading, setLoading] = useState(false);
    const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>(undefined);
    const resolverRef = useRef<((action: TrustMintAction) => void) | null>(null);

    const close = useCallback(() => {
      void sheetRef.current?.dismiss();
    }, []);

    const open = useCallback((token: Token) => {
      setLoading(false);
      setTokenInfo({
        mints: [token.mint],
        value: token.proofs.reduce((r, c) => r + c.amount, 0),
        decoded: token,
      });
      setTimeout(() => {
        try {
          void sheetRef.current?.present();
        } catch {
          /* ignore */
        }
      }, 0);
      return new Promise<TrustMintAction>((resolve) => {
        resolverRef.current = resolve;
      });
    }, []);

    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    const resolveAndClose = (action: TrustMintAction) => {
      if (resolverRef.current) {
        resolverRef.current(action);
        resolverRef.current = null;
      }
      close();
    };

    const handleTrust = () => {
      setLoading(true);
      resolveAndClose("trust");
    };

    const handleCancel = () => resolveAndClose("cancel");

    const handleDismiss = useCallback(() => {
      if (resolverRef.current) {
        resolverRef.current("cancel");
        resolverRef.current = null;
      }
    }, []);

    return (
      <TrueSheet
        ref={sheetRef}
        detents={["auto"]}
        backgroundColor={theme.background}
        cornerRadius={26}
        grabberOptions={{ color: theme.textSecondary }}
        onDidDismiss={handleDismiss}
      >
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[globals().modalHeader, { color: theme.text }, { marginBottom: 15 }]}>
            {t("trustMint")}
          </Text>
          {tokenInfo && (
            <Text style={[styles.mintPrompt, { color: theme.text }]}>
              {formatAmount(tokenInfo.value).formatted} {formatAmount(tokenInfo.value).symbol}{" "}
              {t("from")}:
            </Text>
          )}
          <View style={styles.tokenMintsView}>
            {tokenInfo?.mints.map((m) => (
              <Text style={[styles.mintPrompt, { color: theme.text }]} key={m}>
                {formatMintUrl(m)}
              </Text>
            ))}
          </View>
          <Separator style={[styles.separator]} />
          <TouchableOpacity style={styles.row} onPress={handleTrust}>
            <View style={styles.iconContainer}>
              {loading ? (
                <View>
                  <Loading size="small" color={theme.valid} />
                </View>
              ) : (
                <ReceiveIcon width={26} height={26} color={theme.valid} />
              )}
            </View>
            <View style={styles.txtWrap}>
              <Text style={[styles.actionText, { color: theme.text }]}>
                {loading ? t("claiming", { ns: NS.wallet }) : t("trustMintOpt")}
              </Text>
              <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                {t("trustHint")}
              </Text>
            </View>
          </TouchableOpacity>
          <TxtButton txt={t("cancel")} onPress={handleCancel} style={[styles.TxtButton]} />
        </ScrollView>
      </TrueSheet>
    );
  },
);

TrustMintBottomSheet.displayName = "TrustMintBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    minWidth: "11%",
  },
  txtWrap: {
    width: "90%",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
  },
  mintPrompt: {
    fontSize: 12,
    marginBottom: 5,
  },
  tokenMintsView: {
    marginBottom: 30,
  },
  TxtButton: {
    paddingBottom: 15,
    paddingTop: 25,
  },
  separator: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
});

export default TrustMintBottomSheet;
