// Import shim first to set up crypto polyfill before any other modules
import "../shim";

import { l } from "@log";
import type { INavigatorProps } from "@model/nav";
import Navigator from "@nav/Navigator";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { CustomErrorBoundary } from "@screens/ErrorScreen/ErrorBoundary";
import { BalanceProvider } from "@src/context/Balance";
import { FocusClaimProvider } from "@src/context/FocusClaim";
import { HistoryProvider } from "@src/context/History";

import { PinProvider } from "@src/modules/pin/PinProvider";
import { PrivacyProvider } from "@src/context/Privacy";
import { PromptProvider } from "@src/context/Prompt";
import { ThemeProvider, useThemeContext } from "@src/context/Theme";
import { QRScannerProvider } from "@src/context/QRScanner";
import { KnownMintsProvider } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { dark, light } from "@styles";
import { isErr } from "@util";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { MenuProvider } from "react-native-popup-menu";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import Blank from "./Blank";
import ClipboardModal from "./ClipboardModal";
import QRScannerBottomSheet from "./QRScannerBottomSheet";
import Toaster from "./Toaster";

import * as SplashScreen from "expo-splash-screen";
import { ManagerProvider } from "@src/context/Manager";
import * as SQLite from "expo-sqlite";
import { ExpoSqliteRepositories } from "coco-cashu-expo-sqlite";
import { ConsoleLogger, Manager } from "coco-cashu-core";
import { getSeed } from "@src/storage/store/restore";
import { dbProvider } from "@src/storage/DbProvider";
import { seedService } from "@src/services/SeedService";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { usePinAuth } from "@src/modules/pin/PinProvider";

type PinContextValue = never;

l("[APP] Starting app...");

void SplashScreen.preventAutoHideAsync();

function App(_: { exp: Record<string, unknown> }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <CustomErrorBoundary catchErrors="always">
            <RootApp />
          </CustomErrorBoundary>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
export default App;

function useRootAppState() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const [hasSeed, setHasSeed] = useState(false);
  const { i18n } = useTranslation([NS.common]);
  const [isRdy, setIsRdy] = useState(false);
  const appState = useRef(AppState.currentState);

  const initData = async () => {
    try {
      const [lang] = await Promise.all([store.get(STORE_KEYS.lang)]);
      if (lang?.length) {
        await i18n.changeLanguage(lang);
      }
    } catch (e) {
      l(
        isErr(e)
          ? e.message
          : "Error while initiating the user app configuration."
      );
    }
  };

  const initAuth = async () => {
    const hasSeed = seedService.isMnemonicSet();
    const [onboard] = await Promise.all([store.get(STORE_KEYS.explainer)]);
    setShouldOnboard(onboard && onboard === "1" ? false : true);
    setHasSeed(hasSeed);
  };

  useEffect(() => {
    async function createManager() {
      const db = dbProvider.getDatabase();
      const repo = new ExpoSqliteRepositories({ database: db });
      await repo.init();
      async function seedGetter() {
        const seed = await seedService.getSeed();
        if (!seed) {
          throw new Error("No seed found");
        }
        return seed;
      }
      const mgr = new Manager(
        repo,
        seedGetter,
        new ConsoleLogger(undefined, { level: "debug" })
      );
      await mgr.enableMintQuoteWatcher();
      return mgr;
    }

    async function init() {
      const [_, __, mgr] = await Promise.all([
        initAuth(),
        initData(),
        createManager(),
      ]);
      setManager(mgr);
      setIsRdy(true);
    }

    (async () => {
      await init();
    })();
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRdy,
    manager,
    shouldOnboard,
    hasSeed,
  };
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PinProvider>
        <PrivacyProvider>
          <MenuProvider>
            <BottomSheetModalProvider>
              <NavContainer>
                <BalanceProvider>
                  <FocusClaimProvider>
                    <PromptProvider>
                      <QRScannerProvider>
                        <HistoryProvider>
                          <KnownMintsProvider>
                            <KeyboardProvider>{children}</KeyboardProvider>
                          </KnownMintsProvider>
                        </HistoryProvider>
                      </QRScannerProvider>
                    </PromptProvider>
                  </FocusClaimProvider>
                </BalanceProvider>
              </NavContainer>
            </BottomSheetModalProvider>
          </MenuProvider>
        </PrivacyProvider>
      </PinProvider>
    </ThemeProvider>
  );
}

function RootApp() {
  const { isRdy, manager, shouldOnboard, hasSeed } = useRootAppState();
  const { ready: pinReady } = usePinAuth();
  if (!isRdy || !manager) {
    return <Blank />;
  }
  return (
    <ManagerProvider manager={manager}>
      <AppProviders>
        <Navigator shouldOnboard={shouldOnboard} hasSeed={hasSeed} />
        <SplashGate appReady={isRdy && !!manager} pinReady={pinReady} />
        <StatusBar style="auto" />
        <ClipboardModal />
        <QRScannerBottomSheet />
        <Toaster />
      </AppProviders>
    </ManagerProvider>
  );
}

function NavContainer({ children }: { children: React.ReactNode }) {
  const navigation =
    useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null);
  const { theme } = useThemeContext();

  return (
    <NavigationContainer
      theme={theme === "Light" ? light : dark}
      ref={navigation}
    >
      {children}
    </NavigationContainer>
  );
}

function SplashGate({
  appReady,
  pinReady,
}: {
  appReady: boolean;
  pinReady: boolean;
}) {
  useEffect(() => {
    if (appReady && pinReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady, pinReady]);
  return null;
}
