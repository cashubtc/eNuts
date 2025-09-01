import useMintRecommendations from "@comps/hooks/useMintRecommendations";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import Separator from "@comps/Separator";
import { ChevronRightIcon, ZapIcon, PlusIcon } from "@comps/Icons";
import { IconBtn } from "@comps/Button";
import { useThemeContext } from "@src/context/Theme";
import { MintAddScreenProps } from "@src/nav/navTypes";
import { globals, highlight as hi } from "@src/styles";
import { formatMintUrl, isErr, normalizeMintUrl } from "@util";
import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { s, vs } from "react-native-size-matters";
import TopNav from "@nav/TopNav";
import { isIOS } from "@consts";
import { mintService } from "@src/services/MintService";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { useTranslation } from "react-i18next";

interface RecommendedMintItemProps {
  mint: {
    url: string;
    score: number;
    speedIndex?: number;
    auditorData: {
      name: string;
      averageSwapTimeMs?: number;
      swapCount?: number;
    };
  };
  onPress: (url: string) => void;
  color: any;
  highlight: string;
}

function RecommendedMintItem({
  mint,
  onPress,
  color,
  highlight,
}: RecommendedMintItemProps) {
  const displayName = mint.auditorData.name || formatMintUrl(mint.url);
  const speedText =
    mint.speedIndex !== undefined
      ? `Speed: ${mint.speedIndex}`
      : mint.auditorData.averageSwapTimeMs
      ? `Avg: ${mint.auditorData.averageSwapTimeMs}ms`
      : "Speed: N/A";

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
              {Math.round(mint.score * 10) / 10}
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
        <Text
          style={{
            color: color.TEXT_SECONDARY,
            fontSize: s(11),
          }}
        >
          {speedText}
          {mint.auditorData.swapCount &&
            ` • ${mint.auditorData.swapCount} swaps`}
        </Text>
      </View>
      <ChevronRightIcon color={color.TEXT_SECONDARY} />
    </TouchableOpacity>
  );
}

function AddMintScreen({ navigation, route }: MintAddScreenProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const [inputUrl, setInputUrl] = useState("");
  const search = useMintRecommendations();
  const { openPromptAutoClose } = usePromptContext();

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
      await mintService.addMint(submitted);
      const allMints = await mintService.getAllMints();
      navigation.goBack();
    } catch (e) {
      openPromptAutoClose({
        msg: isErr(e) ? e.message : t("mintConnectionFail", { ns: NS.mints }),
        ms: 2000,
      });
    }
  };

  const sortedMints =
    search.result?.results?.slice()?.sort((a, b) => {
      // Sort by score descending, then by speed index ascending (lower is better)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.speedIndex !== undefined && b.speedIndex !== undefined) {
        return a.speedIndex - b.speedIndex;
      }
      return 0;
    }) || [];

  return (
    <View style={[globals(color).container]}>
      <TopNav
        screenName="Add Mint"
        withBackBtn
        handlePress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : undefined}
        style={{ flex: 1 }}
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
                value={inputUrl}
                placeholder="Enter mint URL or select from recommendations below"
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
          {search.isLoading && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: vs(20),
              }}
            >
              <ActivityIndicator
                size="small"
                color={hi[highlight as keyof typeof hi]}
              />
              <Txt
                txt="Loading recommendations..."
                styles={[{ marginLeft: s(8), color: color.TEXT_SECONDARY }]}
              />
            </View>
          )}

          {search.isError && (
            <View style={{ paddingVertical: vs(20), alignItems: "center" }}>
              <Txt
                txt="Failed to load recommendations"
                styles={[{ color: color.TEXT_SECONDARY }]}
              />
              {search.error && (
                <Text
                  style={{
                    color: color.TEXT_SECONDARY,
                    fontSize: s(12),
                    textAlign: "center",
                    marginTop: vs(4),
                  }}
                >
                  {search.error}
                </Text>
              )}
            </View>
          )}

          {!search.isLoading && !search.isError && sortedMints.length > 0 && (
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
              {sortedMints.map((mint) => (
                <RecommendedMintItem
                  key={mint.url}
                  mint={mint}
                  onPress={handleMintSelect}
                  color={color}
                  highlight={highlight}
                />
              ))}
            </View>
          )}
        </ScrollView>
        {isIOS && <View style={{ height: vs(20) }} />}
      </KeyboardAvoidingView>
    </View>
  );
}

export default AddMintScreen;
