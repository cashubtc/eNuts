import { useAppThemeTokens } from "@styles";
import { SendIcon, ClockIcon, CheckmarkIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { SendHistoryEntry } from "@cashu/coco-core";
import { memo } from "react";

type LatestHistorySendEntryProps = {
  history: SendHistoryEntry;
  variant?: "highlight" | "standard";
};

export const LatestHistorySendEntry = memo(
  function LatestHistorySendEntry({ history, variant = "highlight" }: LatestHistorySendEntryProps) {
    const theme = useAppThemeTokens();
    const iconColor = variant === "highlight" ? theme.accentContrast : theme.text;

    let icon;
    switch (history.state) {
      case "prepared":
      case "pending":
        icon = <ClockIcon color={iconColor} />;
        break;
      case "finalized":
        icon = <CheckmarkIcon color={iconColor} />;
        break;
      case "rolledBack":
      default:
        icon = <SendIcon color={iconColor} />;
    }

    return (
      <LatestHistoryWrapper
        icon={icon}
        name={history.type}
        createdAt={history.createdAt}
        amount={history.amount}
        variant={variant}
        entry={history}
      />
    );
  },
  (prev, next) =>
    prev.history.id === next.history.id &&
    prev.history.state === next.history.state &&
    prev.history.amount === next.history.amount &&
    prev.history.createdAt === next.history.createdAt,
);
