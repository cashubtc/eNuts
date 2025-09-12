import { l } from "@log";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import type { IPinContextValue, IAttemptsState } from "./types";
import {
  clearReauth,
  hasPin as svcHasPin,
  loadLock,
  needsReauth as svcNeedsReauth,
  setBackgroundNow,
} from "./PinService";

const defaultAttempts: IAttemptsState = {
  mismatch: false,
  mismatchCount: 0,
  locked: false,
  lockedCount: 0,
  lockedTime: 0,
};

const PinContext = createContext<IPinContextValue>({
  ready: false,
  hasPin: false,
  needsAuth: false,
  attempts: defaultAttempts,
  setAttempts: () =>
    l("") as unknown as React.Dispatch<React.SetStateAction<IAttemptsState>>,
  clearNeedsAuth: () => undefined,
  refreshHasPin: async () => undefined,
});

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [attempts, setAttempts] = useState<IAttemptsState>(defaultAttempts);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [hp, lock] = await Promise.all([svcHasPin(), loadLock()]);
      if (!mounted) return;
      setHasPin(hp);
      // On cold start, require unlock if a PIN exists
      setNeedsAuth(hp);
      if (lock) setAttempts(lock);
      setReady(true);
    })();
    const sub = AppState.addEventListener("change", async (next) => {
      if (next === "active") {
        const reauth = await svcNeedsReauth();
        setNeedsAuth(reauth);
      } else {
        await setBackgroundNow();
      }
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<IPinContextValue>(
    () => ({
      ready,
      hasPin,
      needsAuth,
      attempts,
      setAttempts,
      clearNeedsAuth: () => {
        setNeedsAuth(false);
        void clearReauth();
      },
      refreshHasPin: async () => setHasPin(await svcHasPin()),
    }),
    [ready, hasPin, needsAuth, attempts]
  );

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePinAuth() {
  return useContext(PinContext);
}
