import Separator from "@comps/Separator";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { ReceiveHistoryEntry } from "coco-cashu-core";
import { HistoryDetailsScreen } from "./HistoryDetailsScreen";
import { HistoryOverview } from "./HistoryOverview";
import { DetailsSection, DetailRow } from "./DetailsSection";

type ReceiveHistoryDetailsProps = {
  entry: ReceiveHistoryEntry;
  onGoBack: () => void;
};

export function ReceiveHistoryDetails({ entry, onGoBack }: ReceiveHistoryDetailsProps) {
  const { t } = useTranslation([NS.history, NS.common]);

  return (
    <HistoryDetailsScreen onGoBack={onGoBack}>
      <HistoryOverview
        amount={entry.amount}
        amountPrefix="+"
        amountColor={mainColors.VALID}
        typeLabel={t("receive")}
        description={t("receivedEcash")}
      />
      <Separator />
      <DetailsSection>
        <DetailRow label={t("date")} value={new Date(entry.createdAt).toLocaleString()} />
        <DetailRow label={t("mint", { ns: NS.common })} value={formatMintUrl(entry.mintUrl)} />
        {entry.unit && <DetailRow label={t("unit", { ns: NS.common })} value={entry.unit} />}
      </DetailsSection>
    </HistoryDetailsScreen>
  );
}
