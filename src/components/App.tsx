// Import shim first to set up crypto polyfill before any other modules
import "../shim";

import { FiveMins } from "@consts/time";
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
import { KeyboardProvider } from "@src/context/Keyboard";

import { PinCtx } from "@src/context/Pin";
import { PrivacyProvider } from "@src/context/Privacy";
import { PromptProvider } from "@src/context/Prompt";
import { ThemeProvider, useThemeContext } from "@src/context/Theme";
import { TrustMintProvider } from "@src/context/TrustMint";
import { QRScannerProvider } from "@src/context/QRScanner";
import { KnownMintsProvider } from "@src/context/KnownMints";
import { NS } from "@src/i18n";
import { secureStore, store } from "@store";
import { SECURESTORE_KEY, STORE_KEYS } from "@store/consts";
import { dark, light } from "@styles";
import { isErr, isNull, isStr } from "@util";
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
import TrustMintModal from "./modal/TrustMintModal";
import Toaster from "./Toaster";

import * as SplashScreen from "expo-splash-screen";
import { ManagerProvider } from "@src/context/Manager";
import * as SQLite from "expo-sqlite";
import { ExpoSqliteRepositories } from "coco-cashu-expo-sqlite";
import { ConsoleLogger, Manager } from "coco-cashu-core";
import { getSeed } from "@src/storage/store/restore";
import { dbProvider } from "@src/storage/DbProvider";
import { seedService } from "@src/services/SeedService";

interface ILockData {
  mismatch: boolean;
  mismatchCount: number;
  locked: boolean;
  lockedCount: number;
  lockedTime: number;
  timestamp: number;
}
type PinContextValue = React.ContextType<typeof PinCtx>;

l("[APP] Starting app...");

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

function useRootAppState() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [auth, setAuth] = useState<INavigatorProps>({ pinHash: "" });
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const [hasSeed, setHasSeed] = useState(false);
  const [sawSeedUpdate, setSawSeedUpdate] = useState(false);
  const [bgAuth, setBgAuth] = useState(false);
  const [attempts, setAttempts] = useState({
    mismatch: false,
    mismatchCount: 0,
    locked: false,
    lockedCount: 0,
    lockedTime: 0,
  });
  const pinData = { attempts, setAttempts };
  const { i18n } = useTranslation([NS.common]);
  const [isRdy, setIsRdy] = useState(false);
  const appState = useRef(AppState.currentState);

  const handlePinForeground = async () => {
    const pw = await secureStore.get(SECURESTORE_KEY);
    if (isNull(pw)) {
      return;
    }
    const now = Math.ceil(Date.now() / 1000);
    const lockData = await store.getObj<ILockData>(STORE_KEYS.lock);
    if (lockData) {
      const secsPassed = now - lockData.timestamp;
      const lockedTime = lockData.lockedTime - secsPassed;
      const { timestamp: _timestamp, ...rest } = lockData;
      setAttempts({ ...rest, mismatch: false, lockedTime });
    }
    const bgTimestamp = await store.get(STORE_KEYS.bgCounter);
    if (isStr(bgTimestamp) && bgTimestamp.length > 0) {
      if (now - +bgTimestamp > FiveMins) {
        setBgAuth(true);
      }
    }
  };

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
    const [pinHash, onboard, sawSeed, seed] = await Promise.all([
      secureStore.get(SECURESTORE_KEY),
      store.get(STORE_KEYS.explainer),
      store.get(STORE_KEYS.sawSeedUpdate),
      store.get(STORE_KEYS.hasSeed),
    ]);
    setAuth({ pinHash: isNull(pinHash) ? "" : pinHash });
    setShouldOnboard(onboard && onboard === "1" ? false : true);
    setSawSeedUpdate(sawSeed && sawSeed === "1" ? true : false);
    setHasSeed(!!seed);
    await handlePinForeground();
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
      try {
        await init();
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          l("[PIN] App has come to the foreground!");
          await handlePinForeground();
        } else {
          l("[PIN] App has gone to the background!");
          await store.set(
            STORE_KEYS.bgCounter,
            `${Math.ceil(Date.now() / 1000)}`
          );
        }
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
    sawSeedUpdate,
    auth,
    bgAuth,
    setBgAuth,
    pinData,
  };
}

function AppProviders({
  children,
  pinData,
}: {
  children: React.ReactNode;
  pinData: PinContextValue;
}) {
  return (
    <ThemeProvider>
      <PinCtx.Provider value={pinData}>
        <PrivacyProvider>
          <MenuProvider>
            <BottomSheetModalProvider>
              <NavContainer>
                <BalanceProvider>
                  <FocusClaimProvider>
                    <PromptProvider>
                      <TrustMintProvider>
                        <QRScannerProvider>
                          <HistoryProvider>
                            <KnownMintsProvider>
                              <KeyboardProvider>{children}</KeyboardProvider>
                            </KnownMintsProvider>
                          </HistoryProvider>
                        </QRScannerProvider>
                      </TrustMintProvider>
                    </PromptProvider>
                  </FocusClaimProvider>
                </BalanceProvider>
              </NavContainer>
            </BottomSheetModalProvider>
          </MenuProvider>
        </PrivacyProvider>
      </PinCtx.Provider>
    </ThemeProvider>
  );
}

function RootApp() {
  const {
    isRdy,
    manager,
    shouldOnboard,
    hasSeed,
    sawSeedUpdate,
    auth,
    bgAuth,
    setBgAuth,
    pinData,
  } = useRootAppState();
  if (!isRdy || !manager) {
    return <Blank />;
  }
  return (
    <ManagerProvider manager={manager}>
      <AppProviders pinData={pinData}>
        <Navigator
          shouldOnboard={shouldOnboard}
          pinHash={auth.pinHash}
          bgAuth={bgAuth}
          setBgAuth={setBgAuth}
          hasSeed={hasSeed}
          sawSeedUpdate={sawSeedUpdate}
        />
        <StatusBar style="auto" />
        <ClipboardModal />
        <QRScannerBottomSheet />
        <TrustMintModal />
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
