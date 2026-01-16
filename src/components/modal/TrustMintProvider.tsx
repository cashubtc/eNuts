import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";
import TrustMintBottomSheet, { type TrustMintBottomSheetRef } from "@modal/TrustMintBottomSheet";
import type { Token } from "@cashu/cashu-ts";

type TrustMintContextValue = {
  open: (token: Token) => Promise<"trust" | "cancel" | "swap">;
};

const TrustMintContext = createContext<TrustMintContextValue | undefined>(undefined);

export function TrustMintModalProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<TrustMintBottomSheetRef>(null);

  const open = useCallback((token: Token) => {
    return ref.current?.open(token) ?? Promise.resolve("cancel");
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <TrustMintContext.Provider value={value}>
      {children}
      <TrustMintBottomSheet ref={ref} />
    </TrustMintContext.Provider>
  );
}

export function useTrustMint() {
  const ctx = useContext(TrustMintContext);
  if (!ctx) {
    throw new Error("useTrustMint must be used within TrustMintModalProvider");
  }
  return ctx;
}
