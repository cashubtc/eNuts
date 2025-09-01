import "../shim";
import { Manager } from "coco-cashu-core";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ManagerContextValue = {
  manager: Manager | null;
  ready: boolean;
  error: Error | null;
  waitUntilReady: () => Promise<Manager>;
};

const ManagerCtx = createContext<ManagerContextValue>({
  manager: null,
  ready: false,
  error: null,
  waitUntilReady: () => Promise.reject(new Error("Manager not initialized")),
});

/**
 * Returns the full manager context (including ready and error state).
 * Use this when you need to check readiness or display fallback UI.
 */
export const useManagerContext = () => useContext(ManagerCtx);

/**
 * Strict hook that returns a non-null Manager.
 * Throws an error if the manager is not ready. Use inside ManagerGate or
 * only in components that are guaranteed to render after manager is initialized.
 */
export const useManager = (): Manager => {
  const { manager } = useManagerContext();
  if (!manager) {
    throw new Error(
      "Manager is not ready. Wrap the component tree with <ManagerGate> or check readiness via useManagerContext()."
    );
  }
  return manager;
};

/**
 * Renders children only when manager is initialized.
 * Optionally accepts a fallback (e.g., spinner or null) while initializing,
 * and an errorFallback for error state.
 */
export const ManagerGate = ({
  children,
  fallback = null,
  errorFallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}) => {
  const { manager, ready, error } = useManagerContext();
  if (error) return <>{errorFallback}</>;
  if (!ready || !manager) return <>{fallback}</>;
  return <>{children}</>;
};

export const ManagerProvider = ({
  manager,
  children,
}: {
  manager: Manager;
  children: React.ReactNode;
}) => {
  const value = useMemo(
    () => ({
      manager,
      ready: true,
      error: null,
      waitUntilReady: () => Promise.resolve(manager),
    }),
    [manager]
  );
  return <ManagerCtx.Provider value={value}>{children}</ManagerCtx.Provider>;
};
