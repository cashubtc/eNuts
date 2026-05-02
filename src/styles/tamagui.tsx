import { Text, View, styled } from "@tamagui/core";
import { TextInput } from "react-native";

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
  fontSize: 14,

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
    },
    size: {
      body: {
        fontSize: 14,
      },
      nav: {
        fontSize: 18,
      },
      modalHeader: {
        fontSize: 22,
      },
      display: {
        fontSize: 48,
      },
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

export const InputFrame = styled(
  TextInput,
  {
    name: "InputFrame",
    backgroundColor: "$inputBackground",
    borderRadius: 50,
    color: "$text",
    fontSize: 14,
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
