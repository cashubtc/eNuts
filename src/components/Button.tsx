import { AppText, ButtonSurface, Stack, XStack, useAppThemeTokens } from "@styles";
import { type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";

import Loading from "./Loading";

interface IButtonProps {
  txt: string;
  onPress: () => void;
  border?: boolean;
  outlined?: boolean;
  filled?: boolean;
  ghost?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large";
}

export default function Button({
  txt,
  onPress,
  border,
  outlined,
  filled,
  ghost,
  destructive,
  disabled,
  loading,
  icon,
  size = "medium",
}: IButtonProps) {
  const theme = useAppThemeTokens();

  // Define size variants
  const sizeStyles = {
    small: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 13,
      spinnerSize: 16,
    },
    medium: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      fontSize: 14,
      spinnerSize: 18,
    },
    large: {
      paddingHorizontal: 22,
      paddingVertical: 20,
      fontSize: 16,
      spinnerSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  // Automatically disable button when loading
  const isDisabled = disabled || loading;
  const isSecondary = filled || outlined || ghost;
  const textColor = isSecondary
    ? destructive
      ? theme.error
      : theme.accent
    : destructive
      ? theme.white
      : theme.accentContrast;
  const buttonBackground =
    outlined || ghost
      ? "transparent"
      : destructive
        ? theme.error
        : filled
          ? theme.white
          : theme.accent;
  const buttonBorderColor = destructive ? theme.error : border ? theme.white : theme.accent;

  return (
    <Stack width="100%">
      <TouchableOpacity
        accessibilityRole="button"
        testID={`${txt}-modal-button`}
        activeOpacity={0.5}
        disabled={isDisabled}
        style={[isDisabled && !loading ? { opacity: 0.3 } : {}, loading ? { opacity: 0.7 } : {}]}
        onPress={onPress}
      >
        <ButtonSurface
          size={size}
          style={[
            {
              backgroundColor: buttonBackground,
              paddingHorizontal: currentSize.paddingHorizontal,
              paddingVertical: currentSize.paddingVertical,
            },
            border || outlined
              ? {
                  borderWidth: 1,
                  borderColor: buttonBorderColor,
                }
              : {},
          ]}
        >
          {!loading && (
            <AppText
              weight="medium"
              align="center"
              style={[
                {
                  color: textColor,
                  fontSize: currentSize.fontSize,
                },
              ]}
            >
              {txt}
            </AppText>
          )}
          {loading && (
            <Stack alignItems="center" justifyContent="center">
              <Loading size={currentSize.spinnerSize} color={textColor} />
            </Stack>
          )}
          {!loading && icon && (
            <Stack position="absolute" right={18} alignItems="center" justifyContent="center">
              {icon}
            </Stack>
          )}
        </ButtonSurface>
      </TouchableOpacity>
    </Stack>
  );
}

interface IIconBtnProps {
  icon: React.ReactNode;
  onPress: () => void;
  outlined?: boolean;
  disabled?: boolean;
  size?: number;
  testId?: string;
}

export function IconBtn({ icon, size, outlined, disabled, onPress, testId }: IIconBtnProps) {
  const theme = useAppThemeTokens();
  return (
    <Stack>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.5}
        style={[
          {
            borderWidth: 2,
            alignItems: "center",
            justifyContent: "center",
          },
          {
            width: size || 60,
            height: size || 60,
            borderRadius: (size || 60) / 2,
            backgroundColor: outlined ? theme.background : theme.accent,
            borderColor: theme.accent,
            // opacity: disabled ? .6 : 1
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testId}
      >
        {icon}
      </TouchableOpacity>
    </Stack>
  );
}

interface ITxtBtnProps {
  txt: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>[];
  txtColor?: string;
}

export function TxtButton({ txt, onPress, icon, disabled, style, txtColor }: ITxtBtnProps) {
  const theme = useAppThemeTokens();
  return (
    <TouchableOpacity
      style={[
        {
          paddingTop: 30,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        ...(style || []),
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={`${txt}-button`}
    >
      <XStack alignItems="center" justifyContent="center">
        <AppText
          weight="medium"
          testID={`${txt}-txt`}
          align="center"
          style={{ color: txtColor || theme.accent, marginRight: icon ? 10 : 0 }}
        >
          {txt}
        </AppText>
        {icon ? icon : null}
      </XStack>
    </TouchableOpacity>
  );
}
