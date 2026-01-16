import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon, ZapIcon, PlusIcon } from "@comps/Icons";
import { IconBtn } from "@comps/Button";
import { useThemeContext } from "@src/context/Theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MintStackParamList } from "@src/nav/navTypes";
import { globals, highlight as hi } from "@src/styles";
import { formatMintUrl, isErr } from "@util";
import { useState } from "react";
import useDiscoverMints from "@comps/hooks/useDiscoverMints";
import { View, TouchableOpacity, Text, ActivityIndicator, ScrollView } from "react-native";
import { s, vs } from "react-native-size-matters";
import Screen from "@comps/Screen";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { useTranslation } from "react-i18next";
import { useManager } from "@src/context/Manager";

interface RecommendedMintItemProps {
  mint: MintRecommendation;
  onPress: (url: string) => void;
  color: any;
  highlight: string;
}

type MintRecommendation = {
  id: number;
  url: string;
  info: string;
  name: string;
  balance: number;
  sum_donations: number;
  updated_at: string;
  next_update: string;
  state: string;
  n_errors: number;
  n_mints: number;
  n_melts: number;
};

function RecommendedMintItem({ mint, color, highlight, onPress }: RecommendedMintItemProps) {
  const displayName = mint.name || formatMintUrl(mint.url);
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: vs(12),
          paddingHorizontal: s(16),
          backgroundColor: color.INPUT_BG,
          marginVertical: vs(4),
          borderRadius: s(8),
        },
      ]}
      onPress={() => onPress(mint.url)}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: vs(4),
          }}
        >
          <Txt txt={displayName} bold styles={[{ color: color.TEXT }]} />
          <View
            style={{
              backgroundColor: hi[highlight as keyof typeof hi],
              paddingHorizontal: s(6),
              paddingVertical: vs(2),
              borderRadius: s(4),
              marginLeft: s(8),
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: s(10),
                fontWeight: "bold",
              }}
            >
              {mint.state}
            </Text>
          </View>
        </View>
        <Text
          style={{
            color: color.TEXT_SECONDARY,
            fontSize: s(12),
            marginBottom: vs(2),
          }}
        >
          {mint.url}
        </Text>
      </View>
      <ChevronRightIcon color={color.TEXT_SECONDARY} />
    </TouchableOpacity>
  );
}

type MintAddScreenProps = NativeStackScreenProps<MintStackParamList, "MintAdd">;

function AddMintScreen({ navigation, route }: MintAddScreenProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const [inputUrl, setInputUrl] = useState("");
  const { recommendations, isLoading, isError } = useDiscoverMints();
  const { openPromptAutoClose } = usePromptContext();
  const manager = useManager();

  const handleMintSelect = (url: string) => {
    setInputUrl(url);
    // You might want to add navigation or other logic here
    // For now, just populate the input field
  };

  const handleConfirmSelection = async () => {
    const submitted = inputUrl.trim();
    if (!submitted) {
      return;
    }
    try {
      await manager.mint.addMint(submitted, { trusted: true });
      navigation.goBack();
    } catch (e) {
      openPromptAutoClose({
        msg: isErr(e) ? e.message : t("mintConnectionFail", { ns: NS.mints }),
        ms: 2000,
      });
    }
  };

  return (
    <Screen
      screenName="Add Mint"
      withBackBtn
      handlePress={() => navigation.goBack()}
      withKeyboard={true}
    >
      <View
        style={{
          paddingHorizontal: s(16),
          paddingBottom: vs(12),
          backgroundColor: color.BACKGROUND,
          borderBottomWidth: 1,
          borderBottomColor: color.BORDER || color.INPUT_BG,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: s(12),
          }}
        >
          <View style={{ flex: 1 }}>
            <TxtInput
              onChangeText={setInputUrl}
              autoCorrect={false}
              value={inputUrl}
              placeholder="Enter mint URL or select from recommendations below"
              autoCapitalize="none"
            />
          </View>
          <View>
            <IconBtn
              icon={<PlusIcon color="white" width={s(20)} height={s(20)} />}
              onPress={handleConfirmSelection}
              disabled={!inputUrl.trim()}
              size={s(48)}
              testId="confirm-mint-button"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: s(16),
          paddingTop: vs(16),
          paddingBottom: vs(20),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: vs(20),
            }}
          >
            <ActivityIndicator size="small" color={hi[highlight as keyof typeof hi]} />
            <Txt
              txt="Loading recommendations..."
              styles={[{ marginLeft: s(8), color: color.TEXT_SECONDARY }]}
            />
          </View>
        )}

        {isError && (
          <View style={{ paddingVertical: vs(20), alignItems: "center" }}>
            <Txt txt="Failed to load recommendations" styles={[{ color: color.TEXT_SECONDARY }]} />
            <Text
              style={{
                color: color.TEXT_SECONDARY,
                fontSize: s(12),
                textAlign: "center",
                marginTop: vs(4),
              }}
            >
              Something went wrong fetching recommendations
            </Text>
          </View>
        )}

        {!isLoading && recommendations.length > 0 && (
          <View>
            <Txt
              txt="Recommended Mints"
              bold
              styles={[
                {
                  color: color.TEXT,
                  marginBottom: vs(12),
                  fontSize: s(16),
                },
              ]}
            />
            {recommendations.map((mint) => (
              <RecommendedMintItem
                key={mint.id}
                mint={mint}
                onPress={handleMintSelect}
                color={color}
                highlight={highlight}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

export default AddMintScreen;
