import { useThemeContext } from "@src/context/Theme";
import {
  AppText,
  ButtonSurface,
  Stack,
  XStack,
  globals,
  highlight as hi,
  mainColors,
} from "@styles";
import { getColor } from "@styles/colors";
import { type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";

import Loading from "./Loading";
import Txt from "./Txt";

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
  const { color, highlight } = useThemeContext();

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
              backgroundColor: hi[highlight],
              paddingHorizontal: currentSize.paddingHorizontal,
              paddingVertical: currentSize.paddingVertical,
            },
            border ? { borderWidth: 1, borderColor: mainColors.WHITE } : {},
            filled ? { backgroundColor: mainColors.WHITE } : {},
            destructive && !outlined && !ghost
              ? {
                  backgroundColor: mainColors.ERROR,
                }
              : {},
            outlined
              ? {
                  backgroundColor: "transparent",
                  paddingHorizontal: currentSize.paddingHorizontal,
                  paddingVertical: currentSize.paddingVertical,
                  borderWidth: 1,
                  borderColor: destructive ? mainColors.ERROR : hi[highlight],
                }
              : {},
            ghost
              ? {
                  backgroundColor: "transparent",
                  paddingHorizontal: currentSize.paddingHorizontal,
                  paddingVertical: currentSize.paddingVertical,
                }
              : {},
          ]}
        >
          {!loading && (
            <Txt
              txt={txt}
              bold
              center
              styles={[
                {
                  color: getColor(highlight, color),
                  fontSize: currentSize.fontSize,
                },
                filled || outlined || ghost ? { color: hi[highlight] } : {},
                destructive && (outlined || ghost)
                  ? { color: mainColors.ERROR }
                  : destructive
                    ? { color: mainColors.WHITE }
                    : {},
              ]}
            />
          )}
          {loading && (
            <Stack alignItems="center" justifyContent="center">
              <Loading
                size={currentSize.spinnerSize}
                color={
                  filled || outlined || ghost
                    ? hi[highlight]
                    : destructive
                      ? mainColors.WHITE
                      : getColor(highlight, color)
                }
              />
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
  const { color, highlight } = useThemeContext();
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
            backgroundColor: outlined ? color.BACKGROUND : hi[highlight],
            borderColor: hi[highlight],
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
  const { color, highlight } = useThemeContext();
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
          style={[
            globals(color).pressTxt,
            { color: txtColor || hi[highlight], marginRight: icon ? 10 : 0 },
          ]}
        >
          {txt}
        </AppText>
        {icon ? icon : null}
      </XStack>
    </TouchableOpacity>
  );
}
