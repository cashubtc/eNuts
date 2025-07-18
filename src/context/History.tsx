import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { l } from "@src/logger";
import { NS } from "@src/i18n";
import {
    historyRepository,
    History as HistoryEntry,
} from "@src/storage/db/repo/HistoryRepository";
import { historyEvents } from "@src/util/events";
import { usePromptContext } from "./Prompt";

export type HistoryEntryType =
    | "ecashSent"
    | "ecashReceived"
    | "ecashSwapped"
    | "lightningSent"
    | "lightningReceived";

const useHistory = () => {
    const { t } = useTranslation([NS.common]);
    const { openPromptAutoClose } = usePromptContext();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [latestHistory, setLatestHistory] = useState<HistoryEntry[]>([]);

    const hasEntries = useMemo(() => history.length > 0, [history]);

    const setHistoryEntries = async () => {
        try {
            const all = await historyRepository.getAll();
            const latest = all.slice(0, 5);
            setHistory(all);
            setLatestHistory(latest);
        } catch (error) {
            l("Failed to load history:", error);
        }
    };

    const addHistoryEntry = async (
        entry: Omit<HistoryEntry, "id" | "createdAt">
    ) => {
        const newEntry = {
            ...entry,
            id: 0, // db will auto-increment
            createdAt: Date.now(),
        };
        const success = await historyRepository.create(newEntry);
        if (success) {
            historyEvents.emit("historyUpdated", null);
        }
        return success;
    };

    const deleteHistory = async () => {
        const success = await historyRepository.deleteAll();
        historyEvents.emit("historyUpdated", null);
        openPromptAutoClose({
            msg: success ? t("historyDeleted") : t("delHistoryErr"),
            success,
        });
    };

    useEffect(() => {
        setHistoryEntries();

        const handleHistoryUpdate = () => setHistoryEntries();
        historyEvents.on("historyUpdated", handleHistoryUpdate);

        return () => {
            historyEvents.off("historyUpdated", handleHistoryUpdate);
        };
    }, []);

    return {
        history,
        latestHistory,
        hasEntries,
        addHistoryEntry,
        deleteHistory,
    };
};
type useHistoryType = ReturnType<typeof useHistory>;

const HistoryCtx = createContext<useHistoryType>({
    history: [],
    latestHistory: [],
    hasEntries: false,
    addHistoryEntry: async () => false,
    deleteHistory: async () => {},
});

export const useHistoryContext = () => useContext(HistoryCtx);

export const HistoryProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <HistoryCtx.Provider value={useHistory()}>{children}</HistoryCtx.Provider>
);
