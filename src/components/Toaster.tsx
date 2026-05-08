import { usePromptContext } from "@src/context/Prompt";
import { AppText, appFontSize, PressableSurface, useAppThemeTokens } from "@styles";
import { StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function Toaster() {
  const insets = useSafeAreaInsets();
  const { prompt, closePrompt } = usePromptContext();
  const theme = useAppThemeTokens();
  return (
    prompt.open && (
      <Animated.View
        entering={FadeInUp}
        exiting={FadeOutUp}
        style={[
          styles.container,
          {
            backgroundColor: prompt.success ? theme.valid : theme.error,
            shadowColor: theme.shadow,
            top: insets.top + 20,
          },
        ]}
      >
        <PressableSurface
          onPress={closePrompt}
          style={styles.txtWrap}
          testID={`${prompt.success ? "success" : "error"}-toaster`}
        >
          <AppText
            style={[styles.txt, { color: theme.white }]}
            align="center"
            testID={`${prompt.msg}-txt`}
          >
            {prompt.msg}
          </AppText>
        </PressableSurface>
      </Animated.View>
    )
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    left: 20,
    right: 20,
    borderRadius: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 20,
  },
  txtWrap: {
    width: "100%",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  txt: {
    fontSize: appFontSize.bodyLarge,
  },
});
