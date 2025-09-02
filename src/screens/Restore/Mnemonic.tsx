import Button from "@comps/Button";
import useCopy from "@comps/hooks/Copy";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import type { IMnemonicPageProps } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { seedService } from "@src/services/SeedService";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, SafeAreaView, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function MnemonicScreen({
  navigation,
  route,
}: IMnemonicPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color } = useThemeContext();
  const [mnemonic, setMnemonic] = useState<string>();

  useEffect(() => {
    const words = seedService.createNewMnemonic();
    if (!words) {
      return;
    }
    setMnemonic(words);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
      <View style={styles.content}>
        <FlatList
          data={mnemonic?.split(" ")}
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
      </View>
      <View style={styles.actionWrap}>
        <Button
          outlined
          txt={t("continue")}
          onPress={() => {
            navigation.navigate("dashboard");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  content: {
    marginTop: `${isIOS ? 20 : 60}@s`,
    paddingHorizontal: "20@s",
  },
  mnemonicWord: {
    padding: "10@s",
    marginBottom: "10@s",
    borderRadius: "10@s",
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
  },
  actionWrap: {
    position: "absolute",
    bottom: isIOS ? "40@s" : "20@s",
    width: "100%",
    paddingHorizontal: "20@s",
  },
  warnContainer: {
    alignItems: "center",
    padding: "20@s",
    rowGap: "10@s",
    borderRadius: "10@s",
    marginBottom: "20@s",
  },
});
