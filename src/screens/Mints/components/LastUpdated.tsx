import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useTranslation } from "react-i18next";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { mintService } from "@src/wallet/services/MintService";
import { l } from "@log";

interface LastUpdatedProps {
  mintUrl: string;
  updatedAt: number;
}

export default function LastUpdated({ mintUrl, updatedAt }: LastUpdatedProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const { openPromptAutoClose } = usePromptContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return t("justNow");
    } else if (diffInHours < 24) {
      return t("hoursAgo", { count: diffInHours });
    } else if (diffInHours < 48) {
      return t("yesterday");
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRefreshMintInfo = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const freshMintInfo = await mintService.getUnknownMintInfo(mintUrl);
      await mintService.updateMint(mintUrl, {
        mintInfo: freshMintInfo,
      });
      openPromptAutoClose({
        msg: t("mintInfoUpdated", { ns: NS.mints }),
        ms: 1500,
      });
    } catch (e) {
      l(e);
      openPromptAutoClose({
        msg: t("mintInfoUpdateFailed", { ns: NS.mints }),
        ms: 2000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <TouchableOpacity
      onLongPress={handleRefreshMintInfo}
      disabled={isRefreshing}
      style={[styles.container, { opacity: isRefreshing ? 0.5 : 1 }]}
      activeOpacity={0.7}
    >
      <Txt
        txt={`${t("lastUpdated", { ns: NS.mints })}: ${formatLastUpdated(
          updatedAt
        )}`}
        styles={[styles.lastUpdatedText, { color: color.TEXT_SECONDARY }]}
      />
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  lastUpdatedText: {
    fontSize: "12@vs",
    fontWeight: "400",
  },
});
