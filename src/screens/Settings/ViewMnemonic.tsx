import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import Loading from "@comps/Loading";
import Button from "@comps/Button";
import { isIOS } from "@consts";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { seedService } from "@src/services/SeedService";
import { useEffect, useState } from "react";
import type { TViewMnemonicPageProps } from "@model/nav";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import useCopy from "@comps/hooks/Copy";
import { CheckmarkIcon, CopyIcon } from "@comps/Icons";
import { mainColors } from "@styles";

export default function ViewMnemonic({ navigation }: TViewMnemonicPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
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
    <Screen
      screenName={"Mnemonic"}
      noIcons
      withBackBtn
      handlePress={() => navigation.goBack()}
    >
      <View style={styles.content}>
        {loading ? (
          <View
            style={[styles.warnContainer, { backgroundColor: color.DRAWER }]}
          >
            <Loading size="large" />
          </View>
        ) : !mnemonic ? (
          <View
            style={[styles.warnContainer, { backgroundColor: color.DRAWER }]}
          >
            <Txt
              txt={"No mnemonic found"}
              styles={[{ color: color.TEXT_SECONDARY }]}
            />
          </View>
        ) : (
          <>
            <FlatList
              data={mnemonic.split(" ")}
              numColumns={2}
              keyExtractor={(_item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.mnemonicWord,
                    {
                      backgroundColor: color.DRAWER,
                      marginRight: index % 2 === 0 ? s(10) : 0,
                    },
                  ]}
                >
                  <Txt bold txt={`${index + 1}. `} />
                  <Txt bold txt={item} />
                </View>
              )}
            />
            <View style={styles.copyButtonContainer}>
              <Button
                txt={copied ? "Copied!" : "Copy Mnemonic"}
                onPress={() => void copy(mnemonic)}
                disabled={copied}
                icon={
                  copied ? (
                    <CheckmarkIcon
                      width={s(18)}
                      height={s(18)}
                      color={mainColors.WHITE}
                    />
                  ) : (
                    <CopyIcon
                      width={s(18)}
                      height={s(18)}
                      color={mainColors.WHITE}
                    />
                  )
                }
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  content: {
    marginTop: `${isIOS ? 20 : 60}@s`,
    paddingHorizontal: "20@s",
  },
  copyButtonContainer: {
    marginTop: "20@s",
  },
  mnemonicWord: {
    padding: "10@s",
    marginBottom: "10@s",
    borderRadius: "10@s",
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
  },
  warnContainer: {
    alignItems: "center",
    padding: "20@s",
    rowGap: "10@s",
    borderRadius: "10@s",
    marginBottom: "20@s",
  },
});
