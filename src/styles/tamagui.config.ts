import { createFont, createTamagui, createTokens } from "@tamagui/core";

type TThemeMode = "dark" | "light";

type TThemePalette = {
  BACKGROUND: string;
  DRAWER: string;
  TEXT: string;
  TEXT_SECONDARY: string;
  INPUT_BG: string;
  INPUT_PH: string;
  BORDER: string;
  DARK_BORDER: string;
};

const themeBase = {
  light: {
    BACKGROUND: "#E7E8E9",
    DRAWER: "#F6F6F6",
    TEXT: "#656565",
    TEXT_SECONDARY: "#ADADAD",
    INPUT_BG: "#F6F6F6",
    INPUT_PH: "#656565",
    BORDER: "#D8D8D8",
    DARK_BORDER: "#E7E8E8",
  },
  dark: {
    BACKGROUND: "#1C1C1E",
    DRAWER: "#252429",
    TEXT: "#EBEBF0",
    TEXT_SECONDARY: "#999DA2",
    INPUT_BG: "#252429",
    INPUT_PH: "#5F6368",
    BORDER: "#5F6368",
    DARK_BORDER: "rgba(59, 67, 84, .5)",
  },
} satisfies Record<TThemeMode, TThemePalette>;

const highlight = {
  Default: "#5DB075",
  Bitcoin: "#FF9900",
  Nuts: "#B37436",
  Sky: "#027DFF",
  Azyre: "#03DDFF",
  Rosy: "#FC7ED0",
  Zap: "#FFCC00",
} as const;

export type HighlightKey = keyof typeof highlight;

export const themeColors = Object.keys(highlight) as HighlightKey[];

const semanticColors = {
  valid: "#5DB076",
  warn: "#FF9900",
  error: "#FF6666",
  black: "#000",
  white: "#FAFAFA",
  grey: "#999",
  blue: "#027DFF",
  zap: highlight.Zap,
  star: "#E5BC50",
} as const;

const tokens = createTokens({
  color: {
    background: themeBase.light.BACKGROUND,
    drawer: themeBase.light.DRAWER,
    text: themeBase.light.TEXT,
    textSecondary: themeBase.light.TEXT_SECONDARY,
    inputBackground: themeBase.light.INPUT_BG,
    border: themeBase.light.BORDER,
    accent: highlight.Default,
    onboardingDefault: highlight.Default,
    onboardingNuts: highlight.Nuts,
    onboardingCashu: "#8038CA",
    onboardingAlpha: semanticColors.black,
    cameraScrim: "rgba(0, 0, 0, 0.42)",
    cameraPanel: "rgba(0, 0, 0, 0.58)",
    cameraPill: "rgba(0, 0, 0, 0.36)",
    cameraFrame: "rgba(255, 255, 255, 0.04)",
    cameraPanelBorder: "rgba(255, 255, 255, 0.12)",
    cameraTrack: "rgba(255, 255, 255, 0.16)",
    cameraMutedText: "rgba(250, 250, 250, 0.72)",
    modalBackdrop: "rgba(0, 0, 0, .5)",
    mintIconBackground: "rgba(0,0,0,0.05)",
    shadow: "#171717",
    white: semanticColors.white,
    black: semanticColors.black,
    grey: semanticColors.grey,
    blue: semanticColors.blue,
    zap: semanticColors.zap,
    star: semanticColors.star,
  },
  radius: {
    0: 0,
    2: 2,
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    round: 999,
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
  },
  zIndex: {
    0: 0,
    1: 1,
    10: 10,
    100: 100,
  },
});

const bodyFont = createFont({
  family: "",
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 22,
    7: 32,
    8: 48,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 20,
    4: 22,
    5: 24,
    6: 28,
    7: 38,
    8: 54,
  },
  weight: {
    1: "400",
    2: "500",
    3: "600",
  },
});

const appThemes = {
  light: createAppTheme("light", "Default"),
  dark: createAppTheme("dark", "Default"),
  ...Object.fromEntries(
    (["light", "dark"] as const).flatMap((mode) =>
      themeColors.map((highlightKey) => [
        getTamaguiThemeName(mode, highlightKey),
        createAppTheme(mode, highlightKey),
      ]),
    ),
  ),
};

export const tamaguiConfig = createTamagui({
  fonts: {
    body: bodyFont,
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    short: { maxHeight: 700 },
    tall: { minHeight: 701 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" },
  },
  shorthands: {},
  tokens,
  themes: appThemes,
  settings: {
    allowedStyleValues: false,
    defaultFont: "body",
    disableSSR: true,
    onlyAllowShorthands: false,
    styleCompat: "react-native",
  },
});

export function getTamaguiThemeName(mode: TThemeMode, highlightKey: keyof typeof highlight) {
  return `${mode}_${highlightKey}`;
}

function createAppTheme(mode: TThemeMode, highlightKey: keyof typeof highlight) {
  const color = themeBase[mode];
  const accent = highlight[highlightKey];

  return {
    background: color.BACKGROUND,
    drawer: color.DRAWER,
    color: color.TEXT,
    text: color.TEXT,
    textSecondary: color.TEXT_SECONDARY,
    inputBackground: color.INPUT_BG,
    placeholder: color.INPUT_PH,
    borderColor: color.BORDER,
    darkBorder: color.DARK_BORDER,
    accent,
    accentContrast: getAccentContrast(highlightKey, color),
    onboardingDefault: highlight.Default,
    onboardingNuts: highlight.Nuts,
    onboardingCashu: "#8038CA",
    onboardingAlpha: semanticColors.black,
    cameraScrim: "rgba(0, 0, 0, 0.42)",
    cameraPanel: "rgba(0, 0, 0, 0.58)",
    cameraPill: "rgba(0, 0, 0, 0.36)",
    cameraFrame: "rgba(255, 255, 255, 0.04)",
    cameraPanelBorder: "rgba(255, 255, 255, 0.12)",
    cameraTrack: "rgba(255, 255, 255, 0.16)",
    cameraMutedText: "rgba(250, 250, 250, 0.72)",
    modalBackdrop: "rgba(0, 0, 0, .5)",
    mintIconBackground: "rgba(0,0,0,0.05)",
    shadow: "#171717",
    valid: semanticColors.valid,
    warn: semanticColors.warn,
    error: semanticColors.error,
    white: semanticColors.white,
    black: semanticColors.black,
    grey: semanticColors.grey,
    blue: semanticColors.blue,
    zap: semanticColors.zap,
    star: semanticColors.star,
  };
}

function getAccentContrast(highlightKey: HighlightKey, color: TThemePalette) {
  if (highlightKey === "Azyre" || highlightKey === "Zap" || highlightKey === "Rosy") {
    return color.BACKGROUND;
  }

  return semanticColors.white;
}

type TAppTamaguiConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends TAppTamaguiConfig {}
}
