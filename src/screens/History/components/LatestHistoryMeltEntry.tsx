import { ZapIcon, CheckmarkIcon } from "@comps/Icons";
import { LatestHistoryWrapper } from "./LatestHistoryWrapper";
import { useThemeContext } from "@src/context/Theme";
import { MeltHistoryEntry } from "coco-cashu-core";
import { getColor } from "@src/styles/colors";
import { memo } from "react";

type LatestHistoryMeltEntryProps = {
  history: MeltHistoryEntry;
  variant?: "highlight" | "standard";
};

export const LatestHistoryMeltEntry = memo(
  function LatestHistoryMeltEntry({
    history,
    variant = "highlight",
  }: LatestHistoryMeltEntryProps) {
    const { color, highlight } = useThemeContext();
    const iconColor =
      variant === "highlight" ? getColor(highlight, color) : color.TEXT;

    let icon;
    switch (history.state) {
      case "UNPAID":
        icon = <ZapIcon color={iconColor} />;
        break;
      case "PAID":
        icon = <CheckmarkIcon color={iconColor} />;
        break;
      case "PENDING":
        icon = <ZapIcon color={iconColor} />;
        break;
      default:
        icon = <ZapIcon color={iconColor} />;
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
    prev.history.createdAt === next.history.createdAt
);
