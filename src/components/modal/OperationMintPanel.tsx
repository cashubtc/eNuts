import { MintBoardIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { Image } from "expo-image";
import type { KnownMintWithBalance } from "@src/context/KnownMints";
import { useThemeContext } from "@src/context/Theme";
import { highlight as hi, mainColors } from "@styles";
import { formatMintUrl } from "@util";
import { useMemo } from "react";
import { View, StyleSheet } from "react-native";

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
  const { color, highlight } = useThemeContext();

  const mintLabel = useMemo(() => {
    return mint.mintInfo.name || mint.name || formatMintUrl(mint.mintUrl);
  }, [mint]);

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: color.DRAWER,
          borderColor: color.BORDER,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {mint.mintInfo.icon_url ? (
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: color.INPUT_BG,
                borderColor: color.BORDER,
              },
            ]}
          >
            <Image
              source={{ uri: mint.mintInfo.icon_url }}
              style={styles.iconImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        ) : (
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: color.INPUT_BG,
                borderColor: color.BORDER,
              },
            ]}
          >
            <MintBoardIcon width={18} height={18} color={hi[highlight]} />
          </View>
        )}

        <View style={styles.mintInfo}>
          <Txt txt={mintLabel} bold styles={[styles.mintName]} />
          <Txt
            txt={formatMintUrl(mint.mintUrl)}
            styles={[styles.mintUrl, { color: color.TEXT_SECONDARY }]}
          />
        </View>
      </View>

      {rows.length ? (
        <View style={[styles.metaWrap, { borderTopColor: color.BORDER }]}>
          {rows.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              style={index < rows.length - 1 ? styles.metaRowSpacing : undefined}
            >
              <MetaRow row={row} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MetaRow({ row }: { row: IOperationMintPanelRow }) {
  const { color } = useThemeContext();

  const valueColor = useMemo(() => {
    switch (row.tone) {
      case "success":
        return mainColors.VALID;
      case "danger":
        return mainColors.ERROR;
      default:
        return color.TEXT;
    }
  }, [color.TEXT, row.tone]);

  return (
    <View style={styles.metaRow}>
      <Txt txt={row.label} styles={[styles.balanceLabel, { color: color.TEXT_SECONDARY }]} />
      <Txt txt={row.value} bold styles={[styles.balanceValue, { color: valueColor }]} />
    </View>
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
    fontSize: 14,
    marginBottom: 2,
  },
  mintUrl: {
    fontSize: 12,
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
    fontSize: 12,
  },
  balanceValue: {
    fontSize: 13,
  },
});
