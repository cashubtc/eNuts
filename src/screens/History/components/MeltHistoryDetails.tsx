import Separator from "@comps/Separator";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { MeltHistoryEntry } from "coco-cashu-core";
import { HistoryDetailsScreen } from "./HistoryDetailsScreen";
import { HistoryOverview } from "./HistoryOverview";
import { DetailsSection, DetailRow } from "./DetailsSection";

const truncateStr = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

type MeltHistoryDetailsProps = {
  entry: MeltHistoryEntry;
  onGoBack: () => void;
};

export function MeltHistoryDetails({
  entry,
  onGoBack,
}: MeltHistoryDetailsProps) {
  const { t } = useTranslation([NS.history, NS.common]);

  const getDescription = () => {
    switch (entry.state) {
      case "UNPAID":
        return t("awaitingPayment", { ns: NS.common });
      case "PENDING":
        return t("paymentPending", { ns: NS.common });
      case "PAID":
        return t("paidInvoice");
      default:
        return t("paidInvoice");
    }
  };

  return (
    <HistoryDetailsScreen onGoBack={onGoBack}>
      <HistoryOverview
        amount={entry.amount}
        amountPrefix="-"
        amountColor={mainColors.ZAP}
        typeLabel={t("melt")}
        description={getDescription()}
      />
      <Separator />
      <DetailsSection>
        <DetailRow
          label={t("date")}
          value={new Date(entry.createdAt).toLocaleString()}
        />
        <DetailRow label={t("status", { ns: NS.common })} value={entry.state} />
        <DetailRow
          label={t("mint", { ns: NS.common })}
          value={formatMintUrl(entry.mintUrl)}
        />
        {entry.unit && (
          <DetailRow label={t("unit", { ns: NS.common })} value={entry.unit} />
        )}
        <DetailRow
          label={t("quoteId", { ns: NS.common })}
          value={truncateStr(entry.quoteId, 20)}
        />
      </DetailsSection>
    </HistoryDetailsScreen>
  );
}
