import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { ChevronRightIcon, ZapIcon, PlusIcon } from "@comps/Icons";
import { IconBtn } from "@comps/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MintStackParamList } from "@src/nav/navTypes";
import { globals, useAppThemeTokens } from "@src/styles";
import { formatMintUrl, isErr } from "@util";
import { useState } from "react";
import useDiscoverMints from "@comps/hooks/useDiscoverMints";
import { View, TouchableOpacity, Text, ActivityIndicator, ScrollView } from "react-native";
import Screen from "@comps/Screen";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { useTranslation } from "react-i18next";
import { useManager } from "@src/context/Manager";

interface RecommendedMintItemProps {
  mint: MintRecommendation;
  onPress: (url: string) => void;
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

function RecommendedMintItem({ mint, onPress }: RecommendedMintItemProps) {
  const displayName = mint.name || formatMintUrl(mint.url);
  const theme = useAppThemeTokens();

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: theme.inputBackground,
          marginVertical: 4,
          borderRadius: 8,
        },
      ]}
      onPress={() => onPress(mint.url)}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Txt txt={displayName} bold styles={[{ color: theme.text }]} />
          <View
            style={{
              backgroundColor: theme.accent,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {mint.state}
            </Text>
          </View>
        </View>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          {mint.url}
        </Text>
      </View>
      <ChevronRightIcon color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

type MintAddScreenProps = NativeStackScreenProps<MintStackParamList, "MintAdd">;

function AddMintScreen({ navigation, route }: MintAddScreenProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
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
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.border || theme.inputBackground,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
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
              icon={<PlusIcon color="white" width={20} height={20} />}
              onPress={handleConfirmSelection}
              disabled={!inputUrl.trim()}
              size={48}
              testId="confirm-mint-button"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
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
              paddingVertical: 20,
            }}
          >
            <ActivityIndicator size="small" color={theme.accent} />
            <Txt
              txt="Loading recommendations..."
              styles={[{ marginLeft: 8, color: theme.textSecondary }]}
            />
          </View>
        )}

        {isError && (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <Txt txt="Failed to load recommendations" styles={[{ color: theme.textSecondary }]} />
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                textAlign: "center",
                marginTop: 4,
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
                  color: theme.text,
                  marginBottom: 12,
                  fontSize: 16,
                },
              ]}
            />
            {recommendations.map((mint) => (
              <RecommendedMintItem key={mint.id} mint={mint} onPress={handleMintSelect} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

export default AddMintScreen;
