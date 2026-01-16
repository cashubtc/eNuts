import Separator from "@comps/Separator";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { MintHistoryEntry } from "coco-cashu-core";
import { HistoryDetailsScreen } from "./HistoryDetailsScreen";
import { HistoryOverview } from "./HistoryOverview";
import { DetailsSection, DetailRow } from "./DetailsSection";
import { TokenSection } from "./TokenSection";

const truncateStr = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

type MintHistoryDetailsProps = {
  entry: MintHistoryEntry;
  onGoBack: () => void;
};

export function MintHistoryDetails({ entry, onGoBack }: MintHistoryDetailsProps) {
  const { t } = useTranslation([NS.history, NS.common]);

  const getDescription = () => {
    if (entry.state === "UNPAID") {
      return t("awaitingPayment", { ns: NS.common });
    }
    return t("receivedFromMint", { ns: NS.common });
  };

  return (
    <HistoryDetailsScreen onGoBack={onGoBack}>
      <HistoryOverview
        amount={entry.amount}
        amountPrefix="+"
        amountColor={mainColors.VALID}
        typeLabel={t("mint", { ns: NS.common })}
        description={getDescription()}
      />
      <Separator />
      <DetailsSection>
        <DetailRow label={t("date")} value={new Date(entry.createdAt).toLocaleString()} />
        <DetailRow label={t("status", { ns: NS.common })} value={entry.state} />
        <DetailRow label={t("mint", { ns: NS.common })} value={formatMintUrl(entry.mintUrl)} />
        {entry.unit && <DetailRow label={t("unit", { ns: NS.common })} value={entry.unit} />}
        <DetailRow label={t("quoteId", { ns: NS.common })} value={truncateStr(entry.quoteId, 20)} />
      </DetailsSection>

      {entry.paymentRequest && (
        <TokenSection label={t("invoice", { ns: NS.common })} value={entry.paymentRequest} />
      )}
    </HistoryDetailsScreen>
  );
}
