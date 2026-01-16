import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { TxtButton } from "@comps/Button";
import { ReceiveIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Separator from "@comps/Separator";
import type { Token } from "@cashu/cashu-ts";
import type { ITokenInfo } from "@model";
import { useThemeContext } from "@src/context/Theme";
import { useCurrencyContext } from "@src/context/Currency";
import { NS } from "@src/i18n";
import { globals, mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

export type TrustMintAction = "trust" | "cancel" | "swap";

export type TrustMintBottomSheetRef = {
  open: (token: Token) => Promise<TrustMintAction>;
  close: () => void;
};

const TrustMintBottomSheet = forwardRef<TrustMintBottomSheetRef, { loading?: boolean }>(
  (_props, ref) => {
    const { t } = useTranslation([NS.common]);
    const { color, highlight } = useThemeContext();
    const { formatAmount } = useCurrencyContext();

    const sheetRef = useRef<BottomSheetModal>(null);
    const [loading, setLoading] = useState(false);
    const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>(undefined);
    const resolverRef = useRef<((action: TrustMintAction) => void) | null>(null);

    const close = useCallback(() => {
      sheetRef.current?.dismiss();
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
          sheetRef.current?.present();
        } catch {
          /* ignore */
        }
      }, 0);
      return new Promise<TrustMintAction>((resolve) => {
        resolverRef.current = resolve;
      });
    }, []);

    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    const handleBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
      ),
      [],
    );

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

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={handleBackdrop}
        backgroundStyle={{ backgroundColor: color.BACKGROUND }}
        handleIndicatorStyle={{ backgroundColor: color.TEXT_SECONDARY }}
        enableDismissOnClose
        enablePanDownToClose
        onDismiss={() => {
          if (resolverRef.current) {
            resolverRef.current("cancel");
            resolverRef.current = null;
          }
        }}
      >
        <BottomSheetScrollView
          style={[styles.scrollContainer, { backgroundColor: color.BACKGROUND }]}
          contentContainerStyle={[styles.container]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[globals(color, highlight).modalHeader, { marginBottom: vs(15) }]}>
            {t("trustMint")}
          </Text>
          {tokenInfo && (
            <Text style={[styles.mintPrompt, { color: color.TEXT }]}>
              {formatAmount(tokenInfo.value).formatted} {formatAmount(tokenInfo.value).symbol}{" "}
              {t("from")}:
            </Text>
          )}
          <View style={styles.tokenMintsView}>
            {tokenInfo?.mints.map((m) => (
              <Text style={[styles.mintPrompt, { color: color.TEXT }]} key={m}>
                {formatMintUrl(m)}
              </Text>
            ))}
          </View>
          <Separator style={[styles.separator]} />
          <TouchableOpacity style={styles.row} onPress={handleTrust}>
            <View style={styles.iconContainer}>
              {loading ? (
                <View>
                  <Loading size="small" color={mainColors.VALID} />
                </View>
              ) : (
                <ReceiveIcon width={s(26)} height={s(26)} color={mainColors.VALID} />
              )}
            </View>
            <View style={styles.txtWrap}>
              <Text style={[styles.actionText, { color: color.TEXT }]}>
                {loading ? t("claiming", { ns: NS.wallet }) : t("trustMintOpt")}
              </Text>
              <Text style={[styles.descriptionText, { color: color.TEXT_SECONDARY }]}>
                {t("trustHint")}
              </Text>
            </View>
          </TouchableOpacity>
          <TxtButton txt={t("cancel")} onPress={handleCancel} style={[styles.TxtButton]} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

TrustMintBottomSheet.displayName = "TrustMintBottomSheet";

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@vs",
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
    fontSize: "14@vs",
    fontWeight: "500",
    marginBottom: "4@vs",
  },
  descriptionText: {
    fontSize: "12@vs",
  },
  mintPrompt: {
    fontSize: "12@vs",
    marginBottom: "5@vs",
  },
  tokenMintsView: {
    marginBottom: "30@vs",
  },
  TxtButton: {
    paddingBottom: vs(15),
    paddingTop: vs(25),
  },
  separator: {
    width: "100%",
    marginTop: "10@vs",
    marginBottom: "10@vs",
  },
});

export default TrustMintBottomSheet;
