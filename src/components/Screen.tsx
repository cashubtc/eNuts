import TopNav from "@nav/TopNav";
import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardCtx } from "@src/context/Keyboard";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

interface IContainerProps {
  children: React.ReactNode;
  screenName?: string;
  withBackBtn?: boolean;
  withCancelBtn?: boolean;
  handlePress?: () => void;
  mintBalance?: number;
  handleMintBalancePress?: () => void;
  disableMintBalance?: boolean;
  noIcons?: boolean;
}

export default function Screen({
  children,
  screenName,
  withBackBtn,
  withCancelBtn,
  handlePress,
  mintBalance,
  handleMintBalancePress,
  disableMintBalance,
  noIcons,
}: IContainerProps) {
  const { color } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { isKeyboardOpen } = useKeyboardCtx();
  return (
    <View
      style={[
        globals(color).container,
        { paddingBottom: isKeyboardOpen ? 0 : insets.bottom },
      ]}
    >
      <TopNav
        screenName={screenName || ""}
        withBackBtn={withBackBtn}
        cancel={withCancelBtn}
        handlePress={handlePress}
        mintBalance={mintBalance}
        handleMintBalancePress={handleMintBalancePress}
        disableMintBalance={disableMintBalance}
        noIcons={noIcons}
      />
      {children}
    </View>
  );
}

export function ScreenWithKeyboard({
  children,
  screenName,
  withBackBtn,
  withCancelBtn,
  handlePress,
  mintBalance,
  handleMintBalancePress,
  disableMintBalance,
  noIcons,
}: IContainerProps) {
  const { color } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { isKeyboardOpen } = useKeyboardCtx();
  return (
    <View style={[globals(color).container]}>
      <TopNav
        screenName={screenName || ""}
        withBackBtn={withBackBtn}
        cancel={withCancelBtn}
        handlePress={handlePress}
        mintBalance={mintBalance}
        handleMintBalancePress={handleMintBalancePress}
        disableMintBalance={disableMintBalance}
        noIcons={noIcons}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"padding"}>
        <View style={{ flex: 1 }}>{children}</View>
      </KeyboardAvoidingView>
    </View>
  );
}
