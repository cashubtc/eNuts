// Import shim first to set up crypto polyfill before any other modules
import "../shim";

import { l } from "@log";
import Navigator from "@nav/Navigator";
import { NavigationContainer } from "@react-navigation/native";
import { CustomErrorBoundary } from "@screens/ErrorScreen/ErrorBoundary";
// Balance is now provided by CocoCashuProvider
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
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuProvider } from "react-native-popup-menu";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { TrustMintModalProvider } from "@modal/TrustMintProvider";

import Blank from "./Blank";
import ClipboardModal from "./ClipboardModal";
import QRScannerBottomSheet from "./QRScannerBottomSheet";
import Toaster from "./Toaster";

import * as SplashScreen from "expo-splash-screen";
import { CocoCashuProvider } from "coco-cashu-react";
import { ExpoSqliteRepositories } from "coco-cashu-expo-sqlite";
import { Manager } from "coco-cashu-core";
import { dbProvider } from "@src/storage/DbProvider";
import { seedService } from "@src/services/SeedService";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { usePinAuth } from "@src/modules/pin/PinProvider";
import { appLogger } from "@src/logger";

l("[APP] Starting app...");

void SplashScreen.preventAutoHideAsync();

function App(_: { exp: Record<string, unknown> }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CustomErrorBoundary catchErrors="always">
          <PinProvider>
            <RootApp />
          </PinProvider>
        </CustomErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
export default App;

function useAppInitialization() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const [hasSeed, setHasSeed] = useState(false);
  const { i18n } = useTranslation([NS.common]);
  const [isAppReady, setIsAppReady] = useState(false);
  const { ready: pinReady } = usePinAuth();

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
    setShouldOnboard(onboard !== "1");
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
        appLogger.child({ name: "Manager" })
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
      setIsAppReady(true);
    }

    (async () => {
      await init();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ready: isAppReady && pinReady,
    manager,
    shouldOnboard,
    hasSeed,
  };
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PrivacyProvider>
        <MenuProvider>
          <BottomSheetModalProvider>
            <TrustMintModalProvider>
              <ThemedNavigationContainer>
                <FocusClaimProvider>
                  <PromptProvider>
                    <QRScannerProvider>
                      <HistoryProvider>
                        <KeyboardProvider>{children}</KeyboardProvider>
                      </HistoryProvider>
                    </QRScannerProvider>
                  </PromptProvider>
                </FocusClaimProvider>
              </ThemedNavigationContainer>
            </TrustMintModalProvider>
          </BottomSheetModalProvider>
        </MenuProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}

function RootApp() {
  const { ready, manager, shouldOnboard, hasSeed } = useAppInitialization();
  useEffect(() => {
    if (ready && manager) {
      void SplashScreen.hide();
    }
  }, [ready, manager]);
  if (!ready || !manager) {
    return <Blank />;
  }
  return (
    <CocoCashuProvider manager={manager}>
      <AppProviders>
        <Navigator shouldOnboard={shouldOnboard} hasSeed={hasSeed} />
        <StatusBar style="auto" />
        <ClipboardModal />
        <QRScannerBottomSheet />
        <Toaster />
      </AppProviders>
    </CocoCashuProvider>
  );
}

function ThemedNavigationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useThemeContext();
  return (
    <NavigationContainer theme={theme === "Light" ? light : dark}>
      {children}
    </NavigationContainer>
  );
}
