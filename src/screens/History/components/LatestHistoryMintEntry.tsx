import { CheckmarkIcon, ClockIcon, EcashIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { MintHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

export const LatestHistoryMintEntry = memo(
  function LatestHistoryMintEntry({ history }: { history: MintHistoryEntry }) {
    const { color, highlight } = useThemeContext();
    let icon;
    switch (history.state) {
      case "UNPAID":
        icon = <ClockIcon color={getColor(highlight, color)} />;
        break;
      case "PAID":
        icon = <CheckmarkIcon color={getColor(highlight, color)} />;
        break;
      default:
        icon = <EcashIcon color={getColor(highlight, color)} />;
    }
    return (
      <LatestHistoryWrapper
        icon={icon}
        name={history.type}
        createdAt={history.createdAt}
        amount={history.amount}
      />
    );
  },
  (prev, next) =>
    prev.history.id === next.history.id &&
    prev.history.state === next.history.state &&
    prev.history.amount === next.history.amount &&
    prev.history.createdAt === next.history.createdAt
);
