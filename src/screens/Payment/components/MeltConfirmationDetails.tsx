import Copy from "@comps/Copy";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import type { MeltOperation } from "@cashu/coco-core";
import { useCurrencyContext } from "@src/context/Currency";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

interface IDetailItem {
  label: string;
  value: string;
  copyValue?: string;
  multiline?: boolean;
  monospace?: boolean;
}

export type MeltConfirmationDetailsProps = {
  mintName: string;
  operation: MeltOperation;
};

export default function MeltConfirmationDetails({
  mintName,
  operation,
}: MeltConfirmationDetailsProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const { formatAmount } = useCurrencyContext();
  const isPending = operation.state === "pending";

  if (operation.state === "init") {
    return null;
  }

  const swapFee = operation.needsSwap ? operation.swap_fee : 0;
  const totalWithFees = operation.amount + operation.fee_reserve + swapFee;
  const invoice = "invoice" in operation.methodData ? operation.methodData.invoice : "";

  const formatDisplayAmount = useCallback(
    (amount: number) => {
      const formatted = formatAmount(amount);
      return `${formatted.formatted} ${formatted.symbol}`;
    },
    [formatAmount],
  );

  const paymentType = useMemo(() => {
    switch (operation.method) {
      case "bolt11":
        return t("lnInvoice");
      default:
        return operation.method.toUpperCase();
    }
  }, [operation.method, t]);

  const summaryItems = useMemo<IDetailItem[]>(
    () => [
      { label: t("amount"), value: formatDisplayAmount(operation.amount) },
      { label: t("estimatedFees"), value: formatDisplayAmount(operation.fee_reserve) },
      ...(operation.needsSwap
        ? [{ label: t("swapFee"), value: formatDisplayAmount(swapFee) }]
        : []),
      { label: t("totalInclFee"), value: formatDisplayAmount(totalWithFees) },
      { label: t("reservedTotal"), value: formatDisplayAmount(operation.inputAmount) },
    ],
    [
      formatDisplayAmount,
      operation.amount,
      operation.fee_reserve,
      operation.inputAmount,
      operation.needsSwap,
      swapFee,
      t,
      totalWithFees,
    ],
  );

  const detailItems = useMemo<IDetailItem[]>(
    () => [
      { label: t("mint"), value: mintName },
      { label: t("paymentType"), value: paymentType },
      { label: t("swap"), value: t(operation.needsSwap ? "yes" : "no") },
      {
        label: t("quoteId"),
        value: truncateMiddle(operation.quoteId),
        copyValue: operation.quoteId,
        monospace: true,
      },
      { label: t("lastUpdate"), value: formatTimestamp(operation.updatedAt) },
    ],
    [mintName, operation.needsSwap, operation.quoteId, operation.updatedAt, paymentType, t],
  );

  const invoiceItem = useMemo<IDetailItem | null>(() => {
    if (!invoice) {
      return null;
    }

    return {
      label: t("invoice"),
      value: truncateMiddle(invoice, 28, 18),
      copyValue: invoice,
      multiline: true,
      monospace: true,
    };
  }, [invoice, t]);

  return (
    <View style={styles.container}>
      <Section accent>
        <Txt
          txt={t("lnPayment")}
          center
          styles={[styles.sectionEyebrow, { color: color.TEXT_SECONDARY }]}
        />
        <Txt
          txt={formatDisplayAmount(operation.amount)}
          center
          bold
          styles={[styles.summaryAmount]}
        />
        {isPending ? (
          <Txt
            txt={t("paymentPending") + "."}
            center
            styles={[styles.pendingBadge, { color: color.TEXT_SECONDARY }]}
          />
        ) : null}
        <DetailsList items={summaryItems} emphasized />
      </Section>

      <Section>
        <DetailsList items={detailItems} />
      </Section>

      {invoiceItem ? (
        <Section title={t("invoice")}>
          <DetailItem {...invoiceItem} />
        </Section>
      ) : null}
    </View>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  const { color, highlight } = useThemeContext();

  return (
    <View
      style={[
        globals(color).wrapContainer,
        styles.section,
        {
          borderColor: accent ? hi[highlight] : color.BORDER,
          borderTopColor: accent ? hi[highlight] : color.BORDER,
          borderBottomColor: accent ? hi[highlight] : color.BORDER,
        },
      ]}
    >
      {title ? (
        <Txt txt={title} styles={[styles.sectionTitle, { color: color.TEXT_SECONDARY }]} />
      ) : null}
      {children}
    </View>
  );
}

function DetailsList({ items, emphasized }: { items: IDetailItem[]; emphasized?: boolean }) {
  return (
    <View style={styles.detailsList}>
      {items.map((item, index) => (
        <View key={item.label}>
          <DetailItem {...item} emphasized={emphasized} />
          {index < items.length - 1 ? <Separator noMargin style={styles.separator} /> : null}
        </View>
      ))}
    </View>
  );
}

function DetailItem({
  label,
  value,
  copyValue,
  multiline,
  monospace,
  emphasized,
}: IDetailItem & { emphasized?: boolean }) {
  const { color } = useThemeContext();

  return (
    <View style={[styles.detailRow, multiline && styles.detailRowMultiline]}>
      <Txt txt={label} styles={[styles.detailLabel, { color: color.TEXT_SECONDARY }]} />
      <View style={[styles.detailValueWrap, multiline && styles.detailValueWrapMultiline]}>
        <Text
          numberOfLines={multiline ? 3 : 1}
          ellipsizeMode={multiline ? "tail" : "middle"}
          style={[
            globals(color).txt,
            styles.detailValue,
            multiline && styles.detailValueMultiline,
            monospace && styles.mono,
            emphasized && styles.detailValueEmphasized,
            { color: color.TEXT },
          ]}
        >
          {value}
        </Text>
        {copyValue ? <Copy txt={copyValue} /> : null}
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

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

const styles = ScaledSheet.create({
  container: {
    gap: "12@vs",
    paddingHorizontal: "8@s",
  },
  section: {
    gap: "14@vs",
    marginBottom: 0,
    paddingBottom: "20@vs",
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: "12@vs",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionEyebrow: {
    fontSize: "12@vs",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: "30@vs",
    fontWeight: "600",
  },
  pendingBadge: {
    fontSize: "13@vs",
  },
  detailsList: {
    gap: 0,
  },
  separator: {
    marginTop: "12@vs",
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12@s",
  },
  detailRowMultiline: {
    alignItems: "flex-start",
  },
  detailLabel: {
    flex: 1,
    fontSize: "14@vs",
  },
  detailValueWrap: {
    flex: 1.4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8@s",
  },
  detailValueWrapMultiline: {
    alignItems: "flex-start",
  },
  detailValue: {
    flex: 1,
    fontSize: "14@vs",
    textAlign: "right",
  },
  detailValueEmphasized: {
    fontSize: "16@vs",
    fontWeight: "600",
  },
  detailValueMultiline: {
    textAlign: "left",
    lineHeight: "20@vs",
  },
  mono: {
    fontFamily: "monospace",
  },
});
