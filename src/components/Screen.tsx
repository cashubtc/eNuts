import TopNav from "@nav/TopNav";
import { isIOS } from "@consts";
import { ScreenFrame, Stack } from "@styles";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

interface IContainerProps {
  children: ReactNode;
  screenName?: string;
  withBackBtn?: boolean;
  withCancelBtn?: boolean;
  handlePress?: () => void;
  handleCancel?: () => void;
  rightAction?: ReactNode;
  withPadding?: boolean;
  withBottomInset?: boolean;
  withKeyboard?: boolean;
}

export default function Screen({
  children,
  screenName,
  withBackBtn,
  withCancelBtn,
  handlePress,
  handleCancel,
  rightAction,
  withPadding = true,
  withBottomInset = true,
  withKeyboard = false,
}: IContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
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
      <Stack style={contentStyle}>{children}</Stack>
    </KeyboardAvoidingView>
  ) : (
    <Stack style={contentStyle}>{children}</Stack>
  );

  return (
    <ScreenFrame style={containerStyle}>
      <TopNav
        screenName={screenName || ""}
        withBackBtn={withBackBtn}
        cancel={withCancelBtn}
        handleCancel={handleCancel}
        handlePress={handlePress}
        rightAction={rightAction}
      />
      {content}
    </ScreenFrame>
  );
}

export function ScreenWithKeyboard(props: IContainerProps) {
  return <Screen {...props} withKeyboard={true} />;
}
