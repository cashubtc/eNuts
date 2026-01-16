import { SendIcon, ClockIcon, CheckmarkIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { SendHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

type LatestHistorySendEntryProps = {
  history: SendHistoryEntry;
  variant?: "highlight" | "standard";
};

export const LatestHistorySendEntry = memo(
  function LatestHistorySendEntry({ history, variant = "highlight" }: LatestHistorySendEntryProps) {
    const { color, highlight } = useThemeContext();
    const iconColor = variant === "highlight" ? getColor(highlight, color) : color.TEXT;

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
