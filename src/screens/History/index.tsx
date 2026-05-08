import Empty from "@comps/Empty";
import { isIOS } from "@consts";
import type { THistoryPageProps } from "@model/nav";
import Screen from "@comps/Screen";
import { HistoryEntry } from "@cashu/coco-core";
import { usePaginatedHistory } from "@cashu/coco-react";
import { FlashList } from "@shopify/flash-list";
import { NS } from "@src/i18n";
import { globals, useAppThemeTokens, Stack } from "@styles";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LatestHistoryMintEntry } from "./components/LatestHistoryMintEntry";
import { LatestHistorySendEntry } from "./components/LatestHistorySendEntry";
import { LatestHistoryMeltEntry } from "./components/LatestHistoryMeltEntry";
import { LatestHistoryReceiveEntry } from "./components/LatestHistoryReceiveEntry";

export default function HistoryPage({ navigation }: THistoryPageProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { history, loadMore, hasMore, isFetching, refresh } = usePaginatedHistory(5);

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
      <Stack style={styles.container}>
        <Stack style={styles.listContainer}>
          {/* History list with infinite scroll */}
          <FlashList
            data={history}
            renderItem={({ item }) => (
              <Stack style={[styles.entryCard, { backgroundColor: theme.drawer }]}>
                {renderHistoryEntry(item)}
              </Stack>
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={<Empty txt={t("noTX") + "..."} />}
            ListFooterComponent={
              isFetching && hasMore ? (
                <Stack style={styles.loaderWrap}>
                  <ActivityIndicator size="small" color={theme.text} />
                </Stack>
              ) : null
            }
            onRefresh={() => void refresh()}
            refreshing={isFetching && history.length === 0}
          />
        </Stack>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 6,
  },
  loaderWrap: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
