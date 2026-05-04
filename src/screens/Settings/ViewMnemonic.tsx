import Screen from "@comps/Screen";
import Loading from "@comps/Loading";
import Button from "@comps/Button";
import { isIOS } from "@consts";
import { NS } from "@src/i18n";
import { seedService } from "@src/services/SeedService";
import { useEffect, useState } from "react";
import type { TViewMnemonicPageProps } from "@model/nav";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet } from "react-native";
import useCopy from "@comps/hooks/Copy";
import { CheckmarkIcon, CopyIcon } from "@comps/Icons";
import { AppText, useAppThemeTokens, Stack } from "@styles";
export default function ViewMnemonic({ navigation }: TViewMnemonicPageProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { copied, copy } = useCopy();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const words = seedService.getMnemonic();
        setMnemonic(words || null);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <Screen screenName={"Mnemonic"} withBackBtn handlePress={() => navigation.goBack()}>
      <Stack style={styles.content}>
        {loading ? (
          <Stack style={[styles.warnContainer, { backgroundColor: theme.drawer }]}>
            <Loading size="large" />
          </Stack>
        ) : !mnemonic ? (
          <Stack style={[styles.warnContainer, { backgroundColor: theme.drawer }]}>
            <AppText style={[{ color: theme.textSecondary }]} testID={"No mnemonic found-txt"}>
              No mnemonic found
            </AppText>
          </Stack>
        ) : (
          <>
            <FlatList
              data={mnemonic.split(" ")}
              numColumns={2}
              keyExtractor={(_item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <Stack
                  style={[
                    styles.mnemonicWord,
                    {
                      backgroundColor: theme.drawer,
                      marginRight: index % 2 === 0 ? 10 : 0,
                    },
                  ]}
                >
                  <AppText
                    weight="medium"
                    testID={`${`${index + 1}. `}-txt`}
                  >{`${index + 1}. `}</AppText>
                  <AppText weight="medium" testID={`${item}-txt`}>
                    {item}
                  </AppText>
                </Stack>
              )}
            />
            <Stack style={styles.copyButtonContainer}>
              <Button
                txt={copied ? "Copied!" : "Copy Mnemonic"}
                onPress={() => void copy(mnemonic)}
                disabled={copied}
                icon={
                  copied ? (
                    <CheckmarkIcon width={18} height={18} color={theme.white} />
                  ) : (
                    <CopyIcon width={18} height={18} color={theme.white} />
                  )
                }
              />
            </Stack>
          </>
        )}
      </Stack>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    marginTop: isIOS ? 20 : 60,
    paddingHorizontal: 20,
  },
  copyButtonContainer: {
    marginTop: 20,
  },
  mnemonicWord: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
  },
  warnContainer: {
    alignItems: "center",
    padding: 20,
    rowGap: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
});
