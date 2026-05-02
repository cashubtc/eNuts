import { createFont, createTamagui, createTokens } from "@tamagui/core";

import { dark, getColor, highlight, light, mainColors, themeColors, type Theme } from "./colors";

type TThemeMode = "dark" | "light";

const themeBase: Record<TThemeMode, Theme> = {
  dark: dark.custom,
  light: light.custom,
};

const tokens = createTokens({
  color: {
    background: light.custom.BACKGROUND,
    drawer: light.custom.DRAWER,
    text: light.custom.TEXT,
    textSecondary: light.custom.TEXT_SECONDARY,
    inputBackground: light.custom.INPUT_BG,
    border: light.custom.BORDER,
    accent: highlight.Default,
    onboardingDefault: highlight.Default,
    onboardingNuts: highlight.Nuts,
    onboardingCashu: "#8038CA",
    white: mainColors.WHITE,
    black: mainColors.BLACK,
    grey: mainColors.GREY,
    blue: mainColors.BLUE,
    zap: mainColors.ZAP,
    star: mainColors.STAR,
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
    accentContrast: getColor(highlightKey, color),
    onboardingDefault: highlight.Default,
    onboardingNuts: highlight.Nuts,
    onboardingCashu: "#8038CA",
    valid: mainColors.VALID,
    warn: mainColors.WARN,
    error: mainColors.ERROR,
    white: mainColors.WHITE,
    black: mainColors.BLACK,
    grey: mainColors.GREY,
    blue: mainColors.BLUE,
    zap: mainColors.ZAP,
    star: mainColors.STAR,
  };
}

type TAppTamaguiConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends TAppTamaguiConfig {}
}
