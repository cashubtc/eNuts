import { Text, View, styled, useTheme } from "@tamagui/core";
import { TextInput, TouchableOpacity } from "react-native";

import { fontScale, verticalScale } from "./scale";

export type TAppTextSize =
  | "micro"
  | "caption"
  | "body"
  | "bodyLarge"
  | "nav"
  | "title"
  | "heading"
  | "display"
  | "amount"
  | "balance"
  | "heroAmount";

export type TAppTextTone =
  | "default"
  | "secondary"
  | "accent"
  | "contrast"
  | "error"
  | "success"
  | "warning"
  | "white"
  | "black";

export type TAppTextWeight = "regular" | "medium" | "semibold" | "bold";

const textSize = (fontSize: number, lineHeight?: number) => ({
  fontSize: fontScale(fontSize),
  ...(lineHeight ? { lineHeight: verticalScale(lineHeight) } : {}),
});

export const Stack = styled(View, {
  name: "Stack",
});

export const XStack = styled(Stack, {
  name: "XStack",
  flexDirection: "row",
});

export const YStack = styled(Stack, {
  name: "YStack",
  flexDirection: "column",
});

export const ScreenFrame = styled(YStack, {
  name: "ScreenFrame",
  flex: 1,
  backgroundColor: "$background",
});

export const Surface = styled(YStack, {
  name: "Surface",
  backgroundColor: "$drawer",
  borderColor: "$borderColor",
  borderRadius: 20,
});

export const AppText = styled(Text, {
  name: "AppText",
  color: "$text",
  fontSize: fontScale(14),

  variants: {
    align: {
      left: {
        textAlign: "left",
      },
      center: {
        textAlign: "center",
      },
      right: {
        textAlign: "right",
      },
    },
    tone: {
      default: {
        color: "$text",
      },
      secondary: {
        color: "$textSecondary",
      },
      accent: {
        color: "$accent",
      },
      contrast: {
        color: "$accentContrast",
      },
      error: {
        color: "$error",
      },
      success: {
        color: "$valid",
      },
      warning: {
        color: "$warn",
      },
      white: {
        color: "$white",
      },
      black: {
        color: "$black",
      },
    },
    weight: {
      regular: {
        fontWeight: "400",
      },
      medium: {
        fontWeight: "500",
      },
      semibold: {
        fontWeight: "600",
      },
      bold: {
        fontWeight: "700",
      },
    },
    size: {
      micro: textSize(10, 14),
      caption: textSize(12, 16),
      body: textSize(14, 20),
      bodyLarge: textSize(16, 22),
      nav: textSize(17, 22),
      title: textSize(20, 25),
      heading: textSize(24, 30),
      display: textSize(28, 34),
      amount: textSize(34, 40),
      balance: textSize(42, 48),
      heroAmount: textSize(64, 74),
    },
  } as const,

  defaultVariants: {
    align: "left",
    tone: "default",
    weight: "regular",
    size: "body",
  },
});

export const ButtonSurface = styled(XStack, {
  name: "ButtonSurface",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 50,

  variants: {
    size: {
      small: {
        paddingHorizontal: 14,
        paddingVertical: 12,
      },
      medium: {
        paddingHorizontal: 18,
        paddingVertical: 18,
      },
      large: {
        paddingHorizontal: 22,
        paddingVertical: 20,
      },
    },
  } as const,

  defaultVariants: {
    size: "medium",
  },
});

export const PressableSurface = styled(TouchableOpacity, {
  name: "PressableSurface",
});

export const InputFrame = styled(
  TextInput,
  {
    name: "InputFrame",
    backgroundColor: "$inputBackground",
    borderRadius: 50,
    color: "$text",
    fontSize: fontScale(14),
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: "100%",
  },
  {
    isText: true,
    accept: {
      placeholderTextColor: "color",
    },
  },
);

export const SeparatorLine = styled(Stack, {
  name: "SeparatorLine",
  borderBottomWidth: 1,
  borderColor: "$darkBorder",
});

export const RadioCircle = styled(Stack, {
  name: "RadioCircle",
  borderColor: "$borderColor",
  borderRadius: 10,
  borderWidth: 1,
  height: 20,
  width: 20,
});

export const ProgressTrack = styled(Stack, {
  name: "ProgressTrack",
  backgroundColor: "$inputBackground",
  height: 5,
  marginBottom: 20,
  width: "100%",
});

export const ProgressFill = styled(Stack, {
  name: "ProgressFill",
  backgroundColor: "$accent",
  height: 5,
});

export function useAppThemeTokens() {
  const theme = useTheme();

  return {
    accent: getThemeColor(theme.accent),
    accentContrast: getThemeColor(theme.accentContrast),
    background: getThemeColor(theme.background),
    border: getThemeColor(theme.borderColor),
    darkBorder: getThemeColor(theme.darkBorder),
    drawer: getThemeColor(theme.drawer),
    error: getThemeColor(theme.error),
    inputBackground: getThemeColor(theme.inputBackground),
    cameraFrame: getThemeColor(theme.cameraFrame),
    cameraMutedText: getThemeColor(theme.cameraMutedText),
    cameraPanel: getThemeColor(theme.cameraPanel),
    cameraPanelBorder: getThemeColor(theme.cameraPanelBorder),
    cameraPill: getThemeColor(theme.cameraPill),
    cameraScrim: getThemeColor(theme.cameraScrim),
    cameraTrack: getThemeColor(theme.cameraTrack),
    mintIconBackground: getThemeColor(theme.mintIconBackground),
    modalBackdrop: getThemeColor(theme.modalBackdrop),
    onboardingAlpha: getThemeColor(theme.onboardingAlpha),
    onboardingCashu: getThemeColor(theme.onboardingCashu),
    onboardingDefault: getThemeColor(theme.onboardingDefault),
    onboardingNuts: getThemeColor(theme.onboardingNuts),
    placeholder: getThemeColor(theme.placeholder),
    text: getThemeColor(theme.text),
    textSecondary: getThemeColor(theme.textSecondary),
    valid: getThemeColor(theme.valid),
    warn: getThemeColor(theme.warn),
    white: getThemeColor(theme.white),
    black: getThemeColor(theme.black),
    blue: getThemeColor(theme.blue),
    grey: getThemeColor(theme.grey),
    star: getThemeColor(theme.star),
    zap: getThemeColor(theme.zap),
    shadow: getThemeColor(theme.shadow),
  };
}

function getThemeColor(value: { get?: (platform?: "web") => string | number } | undefined) {
  const resolved = value?.get?.("web");
  return typeof resolved === "number" ? `${resolved}` : resolved || "";
}
