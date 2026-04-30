import Card from "@comps/Card";
import ConfirmationModal, { type ConfirmationModalRef } from "@modal/ConfirmationModal";
import OperationMintPanel, { type IOperationMintPanelRow } from "@modal/OperationMintPanel";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { SendOperation } from "@cashu/coco-core";
import { useCurrencyContext } from "@src/context/Currency";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { NS } from "@src/i18n";
import { useThemeContext } from "@src/context/Theme";
import { mainColors } from "@styles";
import React, { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { ScaledSheet } from "react-native-size-matters";

export type SendConfirmationModalRef = ConfirmationModalRef;
type TPreparedOrLaterSendOperation = Exclude<SendOperation, { state: "init" }>;

interface ISendConfirmationModalProps {
  operation: TPreparedOrLaterSendOperation | null;
  mint: KnownMintWithBalance | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

type TRowTone = "default" | "success" | "danger";

interface IDetailRow {
  label: string;
  value: string;
  tone?: TRowTone;
}

const SendConfirmationModal = forwardRef<SendConfirmationModalRef, ISendConfirmationModalProps>(
  ({ operation, mint, loading = false, onConfirm, onCancel }, ref) => {
    const { t } = useTranslation([NS.common, NS.auth]);
    const { color } = useThemeContext();
    const { hidden } = usePrivacyContext();
    const { formatAmount } = useCurrencyContext();

    const formatDisplayAmount = useCallback(
      (amount: number) => {
        const { formatted, symbol } = formatAmount(amount);
        return `${formatted} ${symbol}`;
      },
      [formatAmount],
    );

    const summaryRows = useMemo<IDetailRow[]>(() => {
      if (!operation) {
        return [];
      }

      const totalAmount = operation.amount + operation.fee;

      return [
        {
          label: t("estimatedFees", { ns: NS.common }),
          value: formatDisplayAmount(operation.fee),
        },
        {
          label: t("totalInclFee", { ns: NS.common }),
          value: formatDisplayAmount(totalAmount),
        },
        ...(operation.inputAmount !== totalAmount
          ? [
              {
                label: t("reservedTotal", { ns: NS.common }),
                value: formatDisplayAmount(operation.inputAmount),
              },
            ]
          : []),
      ];
    }, [formatDisplayAmount, operation, t]);

    const balanceAfterTx = useMemo(() => {
      if (!operation || !mint) {
        return "";
      }

      const totalAmount = operation.amount + operation.fee;
      const nextBalance = mint.balance - totalAmount;

      if (hidden.balance) {
        return "****";
      }

      return formatDisplayAmount(nextBalance);
    }, [formatDisplayAmount, hidden.balance, mint, operation]);

    const mintRows = useMemo<IOperationMintPanelRow[]>(() => {
      if (!mint) {
        return [];
      }

      return [
        {
          label: t("balanceAfterTX", { ns: NS.common }),
          value: balanceAfterTx,
          tone: "success",
        },
      ];
    }, [balanceAfterTx, mint, t]);

    return (
      <ConfirmationModal
        ref={ref}
        title={t("confirmAction", { ns: NS.auth })}
        subtitle={t("sendEcash", { ns: NS.common })}
        confirmText={t("confirm", { ns: NS.common })}
        cancelText={t("cancel", { ns: NS.common })}
        loading={loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        {operation ? (
          <>
            <Card style={styles.summaryCard}>
              <Txt
                txt={t("amount", { ns: NS.common })}
                center
                styles={[styles.amountLabel, { color: color.TEXT_SECONDARY }]}
              />
              <Txt
                txt={formatDisplayAmount(operation.amount)}
                center
                bold
                styles={[styles.amount]}
              />
              <View style={styles.rowsWrap}>
                {summaryRows.map((row, index) => (
                  <View key={`${row.label}-${index}`}>
                    <DetailRow row={row} />
                    {index < summaryRows.length - 1 ? (
                      <Separator noMargin style={styles.separator} />
                    ) : null}
                  </View>
                ))}
              </View>
            </Card>

            {mint ? (
              <View style={styles.mintSection}>
                <Txt
                  txt={t("sendingFrom", { ns: NS.common, defaultValue: "Sending from" })}
                  styles={[styles.sectionLabel, { color: color.TEXT_SECONDARY }]}
                />
                <OperationMintPanel mint={mint} rows={mintRows} />
              </View>
            ) : null}
          </>
        ) : (
          <View />
        )}
      </ConfirmationModal>
    );
  },
);

function DetailRow({ row }: { row: IDetailRow }) {
  const { color } = useThemeContext();

  const valueColor = useMemo(() => {
    switch (row.tone) {
      case "success":
        return mainColors.VALID;
      case "danger":
        return mainColors.ERROR;
      default:
        return color.TEXT;
    }
  }, [color.TEXT, row.tone]);

  return (
    <View style={styles.detailRow}>
      <Txt txt={row.label} styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]} />
      <Txt txt={row.value} bold styles={[styles.detailValue, { color: valueColor }]} />
    </View>
  );
}

SendConfirmationModal.displayName = "SendConfirmationModal";

const styles = ScaledSheet.create({
  summaryCard: {
    marginBottom: "12@vs",
    paddingHorizontal: "20@s",
    paddingTop: "18@vs",
    paddingBottom: "16@vs",
  },
  amountLabel: {
    fontSize: "12@vs",
    marginBottom: "8@vs",
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: "34@vs",
    lineHeight: "40@vs",
    marginBottom: "20@vs",
  },
  rowsWrap: {
    gap: "2@vs",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12@s",
    paddingVertical: "12@vs",
  },
  detailLabel: {
    flex: 1,
    fontSize: "14@vs",
  },
  detailValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: "14@vs",
  },
  separator: {
    marginVertical: 0,
  },
  mintSection: {
    marginBottom: "16@vs",
  },
  sectionLabel: {
    fontSize: "13@vs",
    marginBottom: "8@vs",
    marginLeft: "2@s",
  },
});

export default SendConfirmationModal;
