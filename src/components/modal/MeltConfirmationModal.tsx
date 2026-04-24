import Card from "@comps/Card";
import Copy from "@comps/Copy";
import ConfirmationModal, { type ConfirmationModalRef } from "@modal/ConfirmationModal";
import OperationMintPanel, { type IOperationMintPanelRow } from "@modal/OperationMintPanel";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { MeltOperation } from "@cashu/coco-core";
import { useCurrencyContext } from "@src/context/Currency";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import React, { forwardRef, useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ScaledSheet } from "react-native-size-matters";

export type MeltConfirmationModalRef = ConfirmationModalRef;

interface IMeltConfirmationModalProps {
  operation: MeltOperation;
  mint: KnownMintWithBalance | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onBackToDashboard: () => void;
}

type TRowTone = "default" | "success" | "danger";

interface IDetailRow {
  label: string;
  value: string;
  copyValue?: string;
  monospace?: boolean;
  tone?: TRowTone;
}

const MeltConfirmationModal = forwardRef<MeltConfirmationModalRef, IMeltConfirmationModalProps>(
  ({ operation, mint, loading = false, onConfirm, onCancel, onBackToDashboard }, ref) => {
    const { t } = useTranslation([NS.common, NS.auth]);
    const { color } = useThemeContext();
    const { hidden } = usePrivacyContext();
    const { formatAmount } = useCurrencyContext();
    const isPending = operation.state === "pending";

    const formatDisplayAmount = useCallback(
      (amount: number) => {
        const { formatted, symbol } = formatAmount(amount);
        return `${formatted} ${symbol}`;
      },
      [formatAmount],
    );

    const summaryRows = useMemo<IDetailRow[]>(() => {
      if (operation.state === "init") {
        return [];
      }

      const swapFee = operation.needsSwap ? operation.swap_fee : 0;
      const totalAmount = operation.amount + operation.fee_reserve + swapFee;

      return [
        {
          label: t("estimatedFees", { ns: NS.common }),
          value: formatDisplayAmount(operation.fee_reserve),
        },
        ...(operation.needsSwap
          ? [
              {
                label: t("swapFee", { ns: NS.common }),
                value: formatDisplayAmount(swapFee),
              },
            ]
          : []),
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

    const detailRows = useMemo<IDetailRow[]>(() => {
      if (operation.state === "init") {
        return [];
      }

      const invoice = "invoice" in operation.methodData ? operation.methodData.invoice : "";

      return [
        {
          label: t("paymentType", { ns: NS.common }),
          value:
            operation.method === "bolt11" ? t("lnInvoice", { ns: NS.common }) : operation.method,
        },
        {
          label: t("swap", { ns: NS.common }),
          value: t(operation.needsSwap ? "yes" : "no", { ns: NS.common }),
        },
        {
          label: t("quoteId", { ns: NS.common }),
          value: truncateMiddle(operation.quoteId),
          copyValue: operation.quoteId,
          monospace: true,
        },
        ...(invoice
          ? [
              {
                label: t("invoice", { ns: NS.common }),
                value: truncateMiddle(invoice, 20, 12),
                copyValue: invoice,
                monospace: true,
              },
            ]
          : []),
      ];
    }, [operation, t]);

    const balanceAfterTx = useMemo(() => {
      if (!mint || operation.state === "init") {
        return "";
      }

      if (hidden.balance) {
        return "****";
      }

      const swapFee = operation.needsSwap ? operation.swap_fee : 0;
      const totalAmount = operation.amount + operation.fee_reserve + swapFee;
      return formatDisplayAmount(mint.balance - totalAmount);
    }, [formatDisplayAmount, hidden.balance, mint, operation]);

    const mintRows = useMemo<IOperationMintPanelRow[]>(() => {
      if (!mint || !balanceAfterTx) {
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

    if (operation.state === "init") {
      return null;
    }

    const cancelText = isPending
      ? t("backToDashboard", { ns: NS.common })
      : t("cancel", { ns: NS.common });

    return (
      <ConfirmationModal
        ref={ref}
        title={t("confirmAction", { ns: NS.auth })}
        subtitle={t("lnPayment", { ns: NS.common })}
        confirmText={t("confirm", { ns: NS.common })}
        cancelText={cancelText}
        loading={loading}
        confirmDisabled={isPending}
        dismissible={!isPending}
        onConfirm={onConfirm}
        onCancel={isPending ? onBackToDashboard : onCancel}
      >
        <Card style={styles.summaryCard}>
          <Txt
            txt={t("amount", { ns: NS.common })}
            center
            styles={[styles.amountLabel, { color: color.TEXT_SECONDARY }]}
          />
          <Txt txt={formatDisplayAmount(operation.amount)} center bold styles={[styles.amount]} />
          {isPending ? (
            <Txt
              txt={t("paymentPending", { ns: NS.common }) + "."}
              center
              styles={[styles.pendingBadge, { color: color.TEXT_SECONDARY }]}
            />
          ) : null}
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
              txt={t("mint", { ns: NS.common })}
              styles={[styles.sectionLabel, { color: color.TEXT_SECONDARY }]}
            />
            <OperationMintPanel mint={mint} rows={mintRows} />
          </View>
        ) : null}

        <Card style={styles.detailsCard}>
          <View style={styles.rowsWrap}>
            {detailRows.map((row, index) => (
              <View key={`${row.label}-${index}`}>
                <DetailRow row={row} />
                {index < detailRows.length - 1 ? (
                  <Separator noMargin style={styles.separator} />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
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
      <View style={styles.detailValueWrap}>
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          style={[
            styles.detailValue,
            row.monospace && styles.mono,
            {
              color: valueColor,
            },
          ]}
        >
          {row.value}
        </Text>
        {row.copyValue ? <Copy txt={row.copyValue} /> : null}
      </View>
    </View>
  );
}

function truncateMiddle(value: string, start = 14, end = 10) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

MeltConfirmationModal.displayName = "MeltConfirmationModal";

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
    marginBottom: "16@vs",
  },
  pendingBadge: {
    fontSize: "13@vs",
    marginBottom: "14@vs",
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
  detailValueWrap: {
    flex: 1.25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8@s",
  },
  detailValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: "14@vs",
    fontWeight: "500",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: "12@vs",
  },
  separator: {
    marginVertical: 0,
  },
  mintSection: {
    marginBottom: "12@vs",
  },
  sectionLabel: {
    fontSize: "13@vs",
    marginBottom: "8@vs",
    marginLeft: "2@s",
  },
  detailsCard: {
    marginBottom: "16@vs",
    paddingHorizontal: "20@s",
    paddingVertical: "4@vs",
  },
});

export default MeltConfirmationModal;
