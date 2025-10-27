import { ReceiveIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { ReceiveHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

type LatestHistoryReceiveEntryProps = {
  history: ReceiveHistoryEntry;
  variant?: "highlight" | "standard";
};

export const LatestHistoryReceiveEntry = memo(
  function LatestHistoryReceiveEntry({
    history,
    variant = "highlight",
  }: LatestHistoryReceiveEntryProps) {
    const { color, highlight } = useThemeContext();
    const iconColor =
      variant === "highlight" ? getColor(highlight, color) : color.TEXT;

    return (
      <LatestHistoryWrapper
        icon={<ReceiveIcon color={iconColor} />}
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
    prev.history.amount === next.history.amount &&
    prev.history.createdAt === next.history.createdAt
);
