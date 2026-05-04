import Card from "@comps/Card";
import Copy from "@comps/Copy";
import ConfirmationModal, { type ConfirmationModalRef } from "@modal/ConfirmationModal";
import OperationMintPanel, { type IOperationMintPanelRow } from "@modal/OperationMintPanel";
import Separator from "@comps/Separator";
import type { MeltOperation } from "@cashu/coco-core";
import { useCurrencyContext } from "@src/context/Currency";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { usePrivacyContext } from "@src/context/Privacy";
import { NS } from "@src/i18n";
import { AppText, verticalScale, fontScale, useAppThemeTokens, Stack } from "@styles";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
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
    const theme = useAppThemeTokens();
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
        onConfirm={onConfirm}
        onCancel={isPending ? onBackToDashboard : onCancel}
      >
        <Card style={styles.summaryCard}>
          <AppText
            style={[styles.amountLabel, { color: theme.textSecondary }]}
            align="center"
            testID={`${t("amount", { ns: NS.common })}-txt`}
          >
            {t("amount", { ns: NS.common })}
          </AppText>
          <AppText
            style={[styles.amount]}
            weight="medium"
            align="center"
            testID={`${formatDisplayAmount(operation.amount)}-txt`}
          >
            {formatDisplayAmount(operation.amount)}
          </AppText>
          {isPending ? (
            <AppText
              style={[styles.pendingBadge, { color: theme.textSecondary }]}
              align="center"
              testID={`${t("paymentPending", { ns: NS.common }) + "."}-txt`}
            >
              {t("paymentPending", { ns: NS.common }) + "."}
            </AppText>
          ) : null}
          <Stack style={styles.rowsWrap}>
            {summaryRows.map((row, index) => (
              <Stack key={`${row.label}-${index}`}>
                <DetailRow row={row} />
                {index < summaryRows.length - 1 ? (
                  <Separator noMargin style={styles.separator} />
                ) : null}
              </Stack>
            ))}
          </Stack>
        </Card>

        {mint ? (
          <Stack style={styles.mintSection}>
            <AppText
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
              testID={`${t("mint", { ns: NS.common })}-txt`}
            >
              {t("mint", { ns: NS.common })}
            </AppText>
            <OperationMintPanel mint={mint} rows={mintRows} />
          </Stack>
        ) : null}

        <Card style={styles.detailsCard}>
          <Stack style={styles.rowsWrap}>
            {detailRows.map((row, index) => (
              <Stack key={`${row.label}-${index}`}>
                <DetailRow row={row} />
                {index < detailRows.length - 1 ? (
                  <Separator noMargin style={styles.separator} />
                ) : null}
              </Stack>
            ))}
          </Stack>
        </Card>
      </ConfirmationModal>
    );
  },
);
function DetailRow({ row }: { row: IDetailRow }) {
  const theme = useAppThemeTokens();
  const valueColor = useMemo(() => {
    switch (row.tone) {
      case "success":
        return theme.valid;
      case "danger":
        return theme.error;
      default:
        return theme.text;
    }
  }, [theme.text, row.tone]);
  return (
    <Stack style={styles.detailRow}>
      <AppText
        style={[styles.detailLabel, { color: theme.textSecondary }]}
        testID={`${row.label}-txt`}
      >
        {row.label}
      </AppText>
      <Stack style={styles.detailValueWrap}>
        <AppText
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
        </AppText>
        {row.copyValue ? <Copy txt={row.copyValue} /> : null}
      </Stack>
    </Stack>
  );
}
function truncateMiddle(value: string, start = 14, end = 10) {
  if (value.length <= start + end + 3) {
    return value;
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
MeltConfirmationModal.displayName = "MeltConfirmationModal";
const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  amountLabel: {
    fontSize: fontScale(12),
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: fontScale(34),
    lineHeight: verticalScale(40),
    marginBottom: 16,
  },
  pendingBadge: {
    fontSize: fontScale(13),
    marginBottom: 14,
  },
  rowsWrap: {
    gap: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: fontScale(14),
  },
  detailValueWrap: {
    flex: 1.25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: fontScale(14),
    fontWeight: "500",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: fontScale(12),
  },
  separator: {
    marginVertical: 0,
  },
  mintSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: fontScale(13),
    marginBottom: 8,
    marginLeft: 2,
  },
  detailsCard: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
});
export default MeltConfirmationModal;
