import Empty from "@comps/Empty";
import { isIOS } from "@consts";
import type { THistoryPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { FlashList } from "@shopify/flash-list";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals } from "@styles";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaledSheet } from "react-native-size-matters";
import { usePaginatedHistory } from "coco-cashu-react";
import { HistoryEntry } from "coco-cashu-core";

import { LatestHistoryMintEntry } from "./components/LatestHistoryMintEntry";
import { LatestHistorySendEntry } from "./components/LatestHistorySendEntry";
import { LatestHistoryMeltEntry } from "./components/LatestHistoryMeltEntry";
import { LatestHistoryReceiveEntry } from "./components/LatestHistoryReceiveEntry";

export default function HistoryPage({ navigation }: THistoryPageProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const { history, loadMore, hasMore, isFetching, refresh } =
    usePaginatedHistory(5);

  const renderHistoryEntry = (entry: HistoryEntry) => {
    switch (entry.type) {
      case "mint":
        return <LatestHistoryMintEntry history={entry} variant="standard" />;
      case "send":
        return <LatestHistorySendEntry history={entry} variant="standard" />;
      case "melt":
        return <LatestHistoryMeltEntry history={entry} variant="standard" />;
      case "receive":
        return <LatestHistoryReceiveEntry history={entry} variant="standard" />;
      default:
        return null;
    }
  };

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      void loadMore();
    }
  };

  return (
    <Screen
      screenName={t("history", { ns: NS.topNav })}
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <View style={styles.listContainer}>
        {/* History list with infinite scroll */}
        <FlashList
          data={history}
          estimatedItemSize={80}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: color.DRAWER }]}>
              {renderHistoryEntry(item)}
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Empty txt={t("noTX") + "..."} />}
          ListFooterComponent={
            isFetching && hasMore ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={color.TEXT} />
              </View>
            ) : null
          }
          onRefresh={() => void refresh()}
          refreshing={isFetching && history.length === 0}
        />
        </View>
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
  entryCard: {
    borderRadius: 20,
    paddingHorizontal: "20@s",
    paddingVertical: "15@vs",
    marginBottom: "6@vs",
  },
  loaderWrap: {
    paddingVertical: "20@vs",
    alignItems: "center",
    justifyContent: "center",
  },
});
