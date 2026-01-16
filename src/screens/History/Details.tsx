import type { THistoryEntryPageProps } from "@model/nav";
import { SendHistoryDetails } from "./components/SendHistoryDetails";
import { MintHistoryDetails } from "./components/MintHistoryDetails";
import { MeltHistoryDetails } from "./components/MeltHistoryDetails";
import { ReceiveHistoryDetails } from "./components/ReceiveHistoryDetails";

export default function HistoryEntryDetails({
  navigation,
  route,
}: THistoryEntryPageProps) {
  const { entry } = route.params;
  const goBack = () => navigation.goBack();

  switch (entry.type) {
    case "send":
      return <SendHistoryDetails entry={entry} onGoBack={goBack} />;
    case "mint":
      return <MintHistoryDetails entry={entry} onGoBack={goBack} />;
    case "melt":
      return <MeltHistoryDetails entry={entry} onGoBack={goBack} />;
    case "receive":
      return <ReceiveHistoryDetails entry={entry} onGoBack={goBack} />;
  }
}
