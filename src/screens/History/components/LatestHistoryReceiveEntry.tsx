import { useAppThemeTokens } from "@styles";
import { ReceiveIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { ReceiveHistoryEntry } from "@cashu/coco-core";
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
    const theme = useAppThemeTokens();
    const iconColor = variant === "highlight" ? theme.accentContrast : theme.text;

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
    prev.history.createdAt === next.history.createdAt,
);
