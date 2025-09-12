import { HistoryEntry } from "coco-cashu-core";
import { View } from "react-native";
import { memo } from "react";
import { LatestHistoryMintEntry } from "./LatestHistoryMintEntry";
import { LatestHistorySendEntry } from "./LatestHistorySendEntry";

type LatestHistoryProps = {
  history: ReadonlyArray<HistoryEntry>;
};

export const LatestHistory = memo(function LatestHistory({
  history,
}: LatestHistoryProps) {
  return <View>{history.map((h) => renderHistoryEntry(h))}</View>;
});

function renderHistoryEntry(history: HistoryEntry) {
  switch (history.type) {
    case "mint":
      return <LatestHistoryMintEntry history={history} key={history.id} />;
    case "send":
      return <LatestHistorySendEntry history={history} key={history.id} />;
    default:
      return null;
  }
}
