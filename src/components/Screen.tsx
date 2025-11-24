import TopNav from "@nav/TopNav";
import { useThemeContext } from "@src/context/Theme";
import { globals } from "@styles";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { isIOS } from "@consts";

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
  rightAction?: React.ReactNode;
  withPadding?: boolean;
  withBottomInset?: boolean;
  withKeyboard?: boolean; // New prop to enable keyboard handling
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
  rightAction,
  withPadding = true,
  withBottomInset = true,
  withKeyboard = false, // Default to false for backward compatibility
}: IContainerProps) {
  const { color } = useThemeContext();
  const insets = useSafeAreaInsets();

  const containerStyle = [
    globals(color).container,
    {
      paddingTop: insets.top,
      paddingBottom: withBottomInset ? insets.bottom : 0,
    },
  ];

  const contentStyle = {
    flex: 1,
    padding: withPadding ? 8 : 0,
  };

  const content = withKeyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={isIOS ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={contentStyle}>{children}</View>
    </KeyboardAvoidingView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  return (
    <View style={containerStyle}>
      <TopNav
        screenName={screenName || ""}
        withBackBtn={withBackBtn}
        cancel={withCancelBtn}
        handlePress={handlePress}
        mintBalance={mintBalance}
        handleMintBalancePress={handleMintBalancePress}
        disableMintBalance={disableMintBalance}
        noIcons={noIcons}
        rightAction={rightAction}
      />
      {content}
    </View>
  );
}

// Legacy export for backward compatibility
// This now just calls the main Screen component with withKeyboard=true
export function ScreenWithKeyboard(props: IContainerProps) {
  return <Screen {...props} withKeyboard={true} />;
}
