import { getPreferences, setPreferences } from "@src/storage/store/theme";
import { l } from "@log";
import type { IPreferences } from "@model";
import { dark, HighlightKey, light, lightTheme } from "@styles";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "dark" | "light" | "auto";

const useTheme = () => {
  // Single source of truth for preferences
  const [pref, setPref] = useState<IPreferences>({
    id: 1,
    mode: "auto",
    formatBalance: false,
    theme: "Default",
    hasPref: false,
  });

  // Track if we're initialized to avoid writing default values to DB
  const isInitialized = useRef(false);

  // Derive the actual theme to display based on mode and device theme
  const deviceColorScheme = useColorScheme() || "light";
  const activeTheme = pref.mode === "auto" ? deviceColorScheme : pref.mode;

  // Memoize color object to avoid unnecessary re-renders
  const color = useMemo(
    () => (activeTheme === "light" ? light.custom : dark.custom),
    [activeTheme]
  );

  // Initialize preferences from database
  useEffect(() => {
    try {
      const prefsDB = getPreferences();
      setPref(prefsDB);
      isInitialized.current = true;
    } catch (e) {
      l(e);
      // Keep default values, mark as initialized
      isInitialized.current = true;
    }
  }, []);

  // Update theme mode and persist to DB
  const updateMode = (mode: ThemeMode) => {
    if (!isInitialized.current) return;

    const newPref = { ...pref, mode };
    setPref(newPref);
    void setPreferences(newPref);
  };

  // Update highlight color and persist to DB
  const updateHighlight = (theme: HighlightKey) => {
    if (!isInitialized.current) return;

    const newPref = { ...pref, theme };
    setPref(newPref);
    void setPreferences(newPref);
  };

  return {
    // Preferences
    pref,
    // Theme state (lowercase for consistency)
    activeTheme,
    mode: pref.mode,
    updateMode,
    // Colors
    color,
    // Highlight
    highlight: pref.theme,
    updateHighlight,
  };
};

type useThemeType = ReturnType<typeof useTheme>;

const ThemeContext = createContext<useThemeType>({
  pref: {
    id: 1,
    mode: "auto",
    formatBalance: false,
    theme: "Default",
    hasPref: false,
  },
  activeTheme: "light",
  mode: "auto",
  updateMode: () => l(""),
  color: lightTheme,
  highlight: "Default",
  updateHighlight: () => l(""),
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={useTheme()}>{children}</ThemeContext.Provider>
);
