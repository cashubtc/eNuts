import { Text, View, styled, useTheme } from "@tamagui/core";
import { TextInput, TouchableOpacity } from "react-native";

import {
  appFontSize,
  appFontWeight,
  appLineHeight,
  type TAppFontSize,
  type TAppFontWeight,
} from "./fonts";

export type TAppTextSize = TAppFontSize;

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

export type TAppTextWeight = TAppFontWeight;

const textSize = (size: TAppTextSize) => ({
  fontSize: appFontSize[size],
  lineHeight: appLineHeight[size],
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
  fontSize: appFontSize.body,

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
        fontWeight: appFontWeight.regular,
      },
      medium: {
        fontWeight: appFontWeight.medium,
      },
      semibold: {
        fontWeight: appFontWeight.semibold,
      },
      bold: {
        fontWeight: appFontWeight.bold,
      },
    },
    size: {
      micro: textSize("micro"),
      fine: textSize("fine"),
      caption: textSize("caption"),
      bodySmall: textSize("bodySmall"),
      body: textSize("body"),
      bodyMedium: textSize("bodyMedium"),
      bodyLarge: textSize("bodyLarge"),
      nav: textSize("nav"),
      label: textSize("label"),
      title: textSize("title"),
      modalTitle: textSize("modalTitle"),
      heading: textSize("heading"),
      display: textSize("display"),
      amountCompact: textSize("amountCompact"),
      amount: textSize("amount"),
      amountLarge: textSize("amountLarge"),
      overviewAmount: textSize("overviewAmount"),
      balance: textSize("balance"),
      amountInput: textSize("amountInput"),
      heroAmount: textSize("heroAmount"),
    },
  } as const,

  defaultVariants: {
    align: "left",
    tone: "default",
    weight: "regular",
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
    fontSize: appFontSize.body,
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
