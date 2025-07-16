import { createContext, useContext, useRef, useState } from "react";
import { l } from "@log";
import type { ITokenInfo } from "@model";
import { Token } from "@cashu/cashu-ts";

export type TrustMintAction = "trust" | "swap" | "cancel";

interface TrustMintState {
    visible: boolean;
    token?: Token;
    loading: boolean;
}

interface TrustMintContextType {
    state: TrustMintState;
    showTrustMintModal: (token: Token) => Promise<TrustMintAction>;
    handleTrustAction: (action: TrustMintAction) => void;
    setLoading: (loading: boolean) => void;
}

const useTrustMint = (): TrustMintContextType => {
    const [state, setState] = useState<TrustMintState>({
        visible: false,
        token: undefined,
        loading: false,
    });

    const resolveRef = useRef<((action: TrustMintAction) => void) | null>(null);

    const showTrustMintModal = (token: Token): Promise<TrustMintAction> => {
        setState({
            visible: true,
            token,
            loading: false,
        });

        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const handleTrustAction = (action: TrustMintAction) => {
        setState((prev) => ({ ...prev, visible: false, loading: false }));

        if (resolveRef.current) {
            resolveRef.current(action);
            resolveRef.current = null;
        }
    };

    const setLoading = (loading: boolean) => {
        setState((prev) => ({ ...prev, loading }));
    };

    return {
        state,
        showTrustMintModal,
        handleTrustAction,
        setLoading,
    };
};

const TrustMintContext = createContext<TrustMintContextType>({
    state: { visible: false, loading: false },
    showTrustMintModal: async () => {
        l("TrustMintContext not initialized");
        return "cancel";
    },
    handleTrustAction: () => l("TrustMintContext not initialized"),
    setLoading: () => l("TrustMintContext not initialized"),
});

export const useTrustMintContext = () => useContext(TrustMintContext);

export const TrustMintProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <TrustMintContext.Provider value={useTrustMint()}>
        {children}
    </TrustMintContext.Provider>
);
