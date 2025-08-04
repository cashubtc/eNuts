import { createContext, useContext, useRef, useState } from "react";
import { l } from "@log";
import type { IMintUrl, ITokenInfo } from "@model";

export interface QRScanOptions {
    mint?: IMintUrl;
    balance?: number;
    isPayment?: boolean;
}

export interface QRScanResult {
    success: boolean;
    data?: string;
    error?: string;
}

interface QRScannerState {
    visible: boolean;
    options?: QRScanOptions;
    loading: boolean;
}

type QRScanCallback = (result: QRScanResult) => void;

interface QRScannerContextType {
    state: QRScannerState;
    openScanner: (callback: QRScanCallback, options?: QRScanOptions) => void;
    handleScanResult: (result: QRScanResult) => void;
    setLoading: (loading: boolean) => void;
    closeScanner: () => void;
}

const useQRScanner = (): QRScannerContextType => {
    const [state, setState] = useState<QRScannerState>({
        visible: false,
        options: undefined,
        loading: false,
    });

    const callbackRef = useRef<QRScanCallback | null>(null);

    const openScanner = (
        callback: QRScanCallback,
        options?: QRScanOptions
    ): void => {
        callbackRef.current = callback;
        setState({
            visible: true,
            options,
            loading: false,
        });
    };

    const handleScanResult = (result: QRScanResult) => {
        setState((prev) => ({ ...prev, visible: false, loading: false }));

        if (callbackRef.current) {
            callbackRef.current(result);
            callbackRef.current = null;
        }
    };

    const closeScanner = () => {
        const result: QRScanResult = { success: false, error: "cancelled" };
        setState((prev) => ({ ...prev, visible: false, loading: false }));

        if (callbackRef.current) {
            callbackRef.current(result);
            callbackRef.current = null;
        }
    };

    const setLoading = (loading: boolean) => {
        setState((prev) => ({ ...prev, loading }));
    };

    return {
        state,
        openScanner,
        handleScanResult,
        setLoading,
        closeScanner,
    };
};

const QRScannerContext = createContext<QRScannerContextType>({
    state: { visible: false, loading: false },
    openScanner: () => {
        l("QRScannerContext not initialized");
    },
    handleScanResult: () => l("QRScannerContext not initialized"),
    setLoading: () => l("QRScannerContext not initialized"),
    closeScanner: () => l("QRScannerContext not initialized"),
});

export const useQRScannerContext = () => useContext(QRScannerContext);

export const QRScannerProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <QRScannerContext.Provider value={useQRScanner()}>
        {children}
    </QRScannerContext.Provider>
);
