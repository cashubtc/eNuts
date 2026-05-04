import { Stack } from "@styles";
import { HistoryEntry } from "@cashu/coco-core";

import { memo } from "react";
import { LatestHistoryMintEntry } from "./LatestHistoryMintEntry";
import { LatestHistorySendEntry } from "./LatestHistorySendEntry";
import { LatestHistoryMeltEntry } from "./LatestHistoryMeltEntry";
import { LatestHistoryReceiveEntry } from "./LatestHistoryReceiveEntry";

type LatestHistoryProps = {
  history: ReadonlyArray<HistoryEntry>;
};

export const LatestHistory = memo(function LatestHistory({ history }: LatestHistoryProps) {
  return <Stack>{history.slice(0, 4).map((h) => renderHistoryEntry(h))}</Stack>;
});

function renderHistoryEntry(history: HistoryEntry) {
  switch (history.type) {
    case "mint":
      return <LatestHistoryMintEntry history={history} key={history.id} />;
    case "send":
      return <LatestHistorySendEntry history={history} key={history.id} />;
    case "melt":
      return <LatestHistoryMeltEntry history={history} key={history.id} />;
    case "receive":
      return <LatestHistoryReceiveEntry history={history} key={history.id} />;
    default:
      return null;
  }
}
