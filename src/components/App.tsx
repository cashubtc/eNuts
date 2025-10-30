// Import shim first to set up crypto polyfill before any other modules
import "../shim";

import { l } from "@log";
import Navigator from "@nav/Navigator";
import { NavigationContainer } from "@react-navigation/native";
import { CustomErrorBoundary } from "@screens/ErrorScreen/ErrorBoundary";
// Balance is now provided by CocoCashuProvider
import { FocusClaimProvider } from "@src/context/FocusClaim";
import { HistoryProvider } from "@src/context/History";

import { PrivacyProvider } from "@src/context/Privacy";
import { PromptProvider } from "@src/context/Prompt";
import { ThemeProvider, useThemeContext } from "@src/context/Theme";
import { QRScannerProvider } from "@src/context/QRScanner";
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
import { Manager, initializeCoco } from "coco-cashu-core";
import { dbProvider } from "@src/storage/DbProvider";
import { seedService } from "@src/services/SeedService";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { appLogger } from "@src/logger";
import { AppState } from "react-native";

void SplashScreen.preventAutoHideAsync();

function App(_: { exp: Record<string, unknown> }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CustomErrorBoundary catchErrors="always">
          <RootApp />
        </CustomErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
export default App;

function useAppInitialization() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const { i18n } = useTranslation([NS.common]);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      appLogger.info("Starting app...");
      // Check seed / database integrity

      const seedFingerprint = await seedService.getFingerprint();
      if (seedFingerprint) {
        // App was initialized before
        const dbFingerprint = dbProvider.getFingerprint();
        if (!dbFingerprint) {
          appLogger.info("Found missmatch in db and seed. Rerolling mnemonic");
          // Fresh database, but old seed. Reroll seed and persist new fingerprint
          const { fingerprint: newFingerprint } =
            await seedService.createNewMnemonic();
          dbProvider.setFingerprint(newFingerprint);
        } else if (seedFingerprint !== dbFingerprint) {
          // This state should never happen, if it does we need to display an error to the user
          //TODO: Display an error to the user
        }
      }

      // Initialise app

      try {
        appLogger.debug("Loading languages...");
        const lang = await store.get(STORE_KEYS.lang);
        if (lang?.length) {
          await i18n.changeLanguage(lang);
        }
        await seedService.ensureMnemonicSet();
        const onboard = await store.get(STORE_KEYS.explainer);
        appLogger.debug("Onboarding already displayed: ", onboard === "1");
        setShouldOnboard(onboard !== "1");
        // Initialize auth, data, and manager in parallel
        const db = dbProvider.getDatabase();
        const repo = new ExpoSqliteRepositories({ database: db });
        const mgr = await initializeCoco({
          repo,
          seedGetter: async () => seedService.getSeed(),
          logger: appLogger.child({ name: "Manager" }),
        });
        // Handle app state changes for subscription management
        AppState.addEventListener("change", (state) => {
          if (state === "background") {
            mgr.pauseSubscriptions();
          } else if (state === "active") {
            mgr.resumeSubscriptions();
          }
        });
        // Only update state if component is still mounted
        if (isMounted) {
          setManager(mgr);
          setIsAppReady(true);
          appLogger.info("App is ready!");
        }
      } catch (error) {
        l(isErr(error) ? error.message : "Failed to initialize app");
        throw error;
      }
    }

    void initializeApp();

    // Cleanup function
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ready: isAppReady,
    manager,
    shouldOnboard,
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
  const { ready, manager, shouldOnboard } = useAppInitialization();
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
        <Navigator shouldOnboard={shouldOnboard} />
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
