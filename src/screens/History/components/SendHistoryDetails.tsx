import Separator from "@comps/Separator";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useTranslation } from "react-i18next";
import { SendHistoryEntry } from "coco-cashu-core";
import { getEncodedToken } from "@cashu/cashu-ts";
import { HistoryDetailsScreen } from "./HistoryDetailsScreen";
import { HistoryOverview } from "./HistoryOverview";
import { DetailsSection, DetailRow } from "./DetailsSection";
import { TokenSection } from "./TokenSection";
import { useEffect, useState } from "react";
import Button from "@comps/Button";
import { useManager, useSend } from "coco-cashu-react";

type SendHistoryDetailsProps = {
  entry: SendHistoryEntry;
  onGoBack: () => void;
};

export function SendHistoryDetails({
  entry,
  onGoBack,
}: SendHistoryDetailsProps) {
  const { t } = useTranslation([NS.history, NS.common]);
  const [reactiveEntry, setReactiveEntry] = useState(entry);
  const manager = useManager();
  const { rollback } = useSend();

  useEffect(() => {
    const unsub = manager.on("history:updated", ({ entry: updatedEntry }) => {
      if (updatedEntry.id === entry.id && updatedEntry.type === "send") {
        setReactiveEntry(updatedEntry as SendHistoryEntry);
      }
    });
    return () => unsub();
  }, [entry.id, manager]);

  const getDescription = () => {
    switch (reactiveEntry.state) {
      case "prepared":
        return t("awaitingPayment", { ns: NS.common });
      case "pending":
        return t("paymentPending", { ns: NS.common });
      case "finalized":
        return t("sentEcash");
      case "rolledBack":
        return reactiveEntry.state;
      default:
        return t("sentEcash");
    }
  };

  const tokenValue = reactiveEntry.token
    ? getEncodedToken(reactiveEntry.token)
    : null;

  return (
    <HistoryDetailsScreen onGoBack={onGoBack}>
      <HistoryOverview
        amount={reactiveEntry.amount}
        amountPrefix="-"
        amountColor={mainColors.ERROR}
        typeLabel={t("send")}
        description={getDescription()}
      />
      <Separator />
      <DetailsSection>
        <DetailRow
          label={t("date")}
          value={new Date(reactiveEntry.createdAt).toLocaleString()}
        />
        <DetailRow
          label={t("status", { ns: NS.common })}
          value={reactiveEntry.state}
        />
        <DetailRow
          label={t("mint", { ns: NS.common })}
          value={formatMintUrl(reactiveEntry.mintUrl)}
        />
        {reactiveEntry.unit && (
          <DetailRow
            label={t("unit", { ns: NS.common })}
            value={reactiveEntry.unit}
          />
        )}
      </DetailsSection>

      {tokenValue && <TokenSection label={t("token")} value={tokenValue} />}
      {reactiveEntry.state === "pending" && (
        <Button
          txt="Abort Send"
          onPress={async () => {
            try {
              await rollback(reactiveEntry.operationId);
            } catch (error) {
              console.error("Error aborting send", error);
            }
          }}
        />
      )}

      {/* Future: Add action buttons for pending tokens */}
      {/* {entry.state === "pending" && (
        <ActionSection>
          <Button onPress={handleShare}>Share Token</Button>
          <Button onPress={handleRollback}>Cancel</Button>
        </ActionSection>
      )} */}
    </HistoryDetailsScreen>
  );
}
