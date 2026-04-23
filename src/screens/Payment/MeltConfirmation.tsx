import Button from "@comps/Button";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import type { MeltOperation } from "@cashu/coco-core";
import { useMeltOperation } from "@cashu/coco-react";
import type { TBeforeRemoveEvent } from "@model/nav";
import { useKnownMints } from "@src/context/KnownMints";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { MeltConfirmationProps } from "@src/nav/navTypes";
import { formatMintUrl, isErr } from "@util";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MeltConfirmationDetails from "./components/MeltConfirmationDetails";

type TFinalizedMeltOperation = Extract<MeltOperation, { state: "finalized" }>;

export default function MeltConfirmationScreen({ navigation, route }: MeltConfirmationProps) {
  const { operation, mintUrl } = route.params;
  const { knownMints } = useKnownMints();
  const { openPromptAutoClose } = usePromptContext();
  const { t } = useTranslation([NS.common, NS.auth]);
  const { color } = useThemeContext();
  const insets = useSafeAreaInsets();
  const hasNavigatedRef = useRef(false);
  const { cancel, currentOperation, execute, isLoading } = useMeltOperation(operation);

  const mint = knownMints.find((item) => item.mintUrl === mintUrl);
  const mintName = mint?.mintInfo.name || formatMintUrl(mintUrl);
  const displayOperation = currentOperation || operation;
  const isPending = displayOperation.state === "pending";
  const canCancelOnExit = displayOperation.state === "prepared";

  const showError = useCallback(
    (error: unknown) => {
      if (isErr(error)) {
        openPromptAutoClose({ msg: error.message || "Something went wrong" });
      }
      console.error(error);
    },
    [openPromptAutoClose],
  );

  const navigateToSuccess = useCallback(
    (finalizedOperation: TFinalizedMeltOperation) => {
      if (hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;

      navigation.navigate("successScreen", {
        type: "melt",
        mint: mintName,
        amount: finalizedOperation.amount,
        fee: finalizedOperation.effectiveFee ?? operation.fee_reserve,
        change: finalizedOperation.changeAmount,
      });
    },
    [mintName, navigation, operation.fee_reserve],
  );

  const cancelPreparedOperation = useCallback(async () => {
    if (!canCancelOnExit || isLoading) {
      return true;
    }

    try {
      await cancel();
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  }, [canCancelOnExit, cancel, isLoading, showError]);

  useEffect(() => {
    if (currentOperation && currentOperation.state === "finalized") {
      navigateToSuccess(currentOperation);
    }
  }, [currentOperation]);

  useEffect(() => {
    const handleBeforeRemove = (e: TBeforeRemoveEvent) => {
      if (!canCancelOnExit) {
        return;
      }

      e.preventDefault();

      if (isLoading) {
        return;
      }

      void cancelPreparedOperation().then((didCancel) => {
        if (didCancel) {
          navigation.dispatch(e.data.action);
        }
      });
    };

    return navigation.addListener("beforeRemove", handleBeforeRemove);
  }, [canCancelOnExit, cancelPreparedOperation, isLoading, navigation]);

  const handleConfirm = useCallback(async () => {
    try {
      await execute();
    } catch (error) {
      showError(error);
    }
  }, [execute, navigateToSuccess, showError]);

  return (
    <Screen
      screenName={t("lnPayment")}
      withBackBtn
      handlePress={() => navigation.goBack()}
      disableMintBalance
      withPadding={false}
      withBottomInset={false}
    >
      <View style={styles.container}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerWrap}>
            <Txt txt={t("confirmAction", { ns: NS.auth })} bold styles={[styles.headerTitle]} />
            <Txt txt={mintName} styles={[styles.headerSubtitle, { color: color.TEXT_SECONDARY }]} />
          </View>
          <MeltConfirmationDetails mintName={mintName} operation={displayOperation} />
        </ScrollView>
        <View
          style={[
            styles.actionWrap,
            {
              backgroundColor: color.BACKGROUND,
              borderTopColor: color.BORDER,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <Button
            txt={t("confirm")}
            onPress={handleConfirm}
            disabled={isPending}
            loading={isLoading}
          />
          {isPending && (
            <Button
              txt={t("backToDashboard")}
              onPress={() => navigation.navigate("dashboard")}
              ghost
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: "10@vs",
    paddingBottom: "24@vs",
    gap: "12@vs",
  },
  headerWrap: {
    gap: "6@vs",
    paddingHorizontal: "20@s",
    paddingTop: "6@vs",
    paddingBottom: "4@vs",
  },
  headerTitle: {
    fontSize: "24@vs",
    lineHeight: "30@vs",
  },
  headerSubtitle: {
    fontSize: "14@vs",
  },
  actionWrap: {
    paddingHorizontal: "20@s",
    paddingTop: "14@vs",
    gap: "10@vs",
    borderTopWidth: 1,
  },
});
