import { MintBoardIcon } from "@comps/Icons";
import { Image } from "expo-image";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { AppText, fontScale, useAppThemeTokens, Stack } from "@styles";
import { formatMintUrl } from "@util";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
type TOperationMintPanelRowTone = "default" | "success" | "danger";
export interface IOperationMintPanelRow {
  label: string;
  value: string;
  tone?: TOperationMintPanelRowTone;
}
interface IOperationMintPanelProps {
  mint: KnownMintWithBalance;
  rows: IOperationMintPanelRow[];
}
export default function OperationMintPanel({ mint, rows }: IOperationMintPanelProps) {
  const theme = useAppThemeTokens();
  const mintLabel = useMemo(() => {
    return mint.mintInfo.name || mint.name || formatMintUrl(mint.mintUrl);
  }, [mint]);
  return (
    <Stack
      style={[
        styles.panel,
        {
          backgroundColor: theme.drawer,
          borderColor: theme.border,
        },
      ]}
    >
      <Stack style={styles.headerRow}>
        {mint.mintInfo.icon_url ? (
          <Stack
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Image
              source={{ uri: mint.mintInfo.icon_url }}
              style={styles.iconImage}
              contentFit="cover"
              transition={200}
            />
          </Stack>
        ) : (
          <Stack
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <MintBoardIcon width={18} height={18} color={theme.accent} />
          </Stack>
        )}

        <Stack style={styles.mintInfo}>
          <AppText style={[styles.mintName]} weight="medium" testID={`${mintLabel}-txt`}>
            {mintLabel}
          </AppText>
          <AppText
            style={[styles.mintUrl, { color: theme.textSecondary }]}
            testID={`${formatMintUrl(mint.mintUrl)}-txt`}
          >
            {formatMintUrl(mint.mintUrl)}
          </AppText>
        </Stack>
      </Stack>

      {rows.length ? (
        <Stack style={[styles.metaWrap, { borderTopColor: theme.border }]}>
          {rows.map((row, index) => (
            <Stack
              key={`${row.label}-${index}`}
              style={index < rows.length - 1 ? styles.metaRowSpacing : undefined}
            >
              <MetaRow row={row} />
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
function MetaRow({ row }: { row: IOperationMintPanelRow }) {
  const theme = useAppThemeTokens();
  const valueColor = useMemo(() => {
    switch (row.tone) {
      case "success":
        return theme.valid;
      case "danger":
        return theme.error;
      default:
        return theme.text;
    }
  }, [theme.text, row.tone]);
  return (
    <Stack style={styles.metaRow}>
      <AppText
        style={[styles.balanceLabel, { color: theme.textSecondary }]}
        testID={`${row.label}-txt`}
      >
        {row.label}
      </AppText>
      <AppText
        style={[styles.balanceValue, { color: valueColor }]}
        weight="medium"
        testID={`${row.value}-txt`}
      >
        {row.value}
      </AppText>
    </Stack>
  );
}
const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  mintInfo: {
    flex: 1,
  },
  mintName: {
    fontSize: fontScale(14),
    marginBottom: 2,
  },
  mintUrl: {
    fontSize: fontScale(12),
  },
  metaWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  metaRowSpacing: {
    marginBottom: 8,
  },
  balanceLabel: {
    flex: 1,
    fontSize: fontScale(12),
  },
  balanceValue: {
    fontSize: fontScale(13),
  },
});
