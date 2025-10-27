import { ReceiveIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { ReceiveHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

export const LatestHistoryReceiveEntry = memo(
  function LatestHistoryReceiveEntry({
    history,
  }: {
    history: ReceiveHistoryEntry;
  }) {
    const { color, highlight } = useThemeContext();
    return (
      <LatestHistoryWrapper
        icon={<ReceiveIcon color={getColor(highlight, color)} />}
        name={history.type}
        createdAt={history.createdAt}
        amount={history.amount}
      />
    );
  },
  (prev, next) =>
    prev.history.id === next.history.id &&
    prev.history.amount === next.history.amount &&
    prev.history.createdAt === next.history.createdAt
);


