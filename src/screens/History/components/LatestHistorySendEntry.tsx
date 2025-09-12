import { SendIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { SendHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

export const LatestHistorySendEntry = memo(
  function LatestHistorySendEntry({ history }: { history: SendHistoryEntry }) {
    const { color, highlight } = useThemeContext();
    return (
      <LatestHistoryWrapper
        icon={<SendIcon color={getColor(highlight, color)} />}
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
