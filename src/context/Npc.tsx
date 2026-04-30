import type { Manager } from "@cashu/coco-core";
import { useManager } from "@src/context/Manager";
import {
  createDefaultNpcAccount,
  getNpcAccountInfo,
  getNpcAddress,
  getNpcExtension,
  isValidNpcUsername,
  type IStoredNpcAccount,
  NPC_DEFAULT_ACCOUNT_ID,
  registerNpcAccount,
  removeNpcAccount,
  setNpcUsernameWithLocalBalance,
  syncNpcAccount,
} from "@src/services/NpcService";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

export interface INpcAccount extends IStoredNpcAccount {
  npub: string;
  address: string;
  isDefault: boolean;
  isRunning: boolean;
  isSyncing: boolean;
}

interface INpcContext {
  accounts: INpcAccount[];
  isLoading: boolean;
  busyAccountId: string | null;
  addAccount: () => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  refreshAccount: (accountId: string) => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  saveUsername: (accountId: string, username: string) => Promise<void>;
}

const NpcCtx = createContext<INpcContext | null>(null);

function parseAccounts(raw: string | null): IStoredNpcAccount[] {
  if (!raw) {
    return [createDefaultNpcAccount()];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [createDefaultNpcAccount()];
    }

    const accounts = parsed
      .filter((account): account is IStoredNpcAccount => {
        return (
          account &&
          typeof account.id === "string" &&
          typeof account.accountIndex === "number" &&
          typeof account.label === "string"
        );
      })
      .sort((a, b) => a.accountIndex - b.accountIndex);

    if (!accounts.some((account) => account.id === NPC_DEFAULT_ACCOUNT_ID)) {
      accounts.unshift(createDefaultNpcAccount());
    }

    return accounts.length ? accounts : [createDefaultNpcAccount()];
  } catch {
    return [createDefaultNpcAccount()];
  }
}

async function loadStoredAccounts() {
  const accounts = parseAccounts(await store.get(STORE_KEYS.npcAccounts));
  await saveStoredAccounts(accounts);
  return accounts;
}

async function saveStoredAccounts(accounts: IStoredNpcAccount[]) {
  await store.set(STORE_KEYS.npcAccounts, JSON.stringify(accounts));
}

async function hydrateAccount(manager: Manager, account: IStoredNpcAccount): Promise<INpcAccount> {
  const { api, identity } = await registerNpcAccount(manager, account);
  let username = account.username;

  try {
    const info = await getNpcAccountInfo(api);
    username = info.name || username;
  } catch {
    // Account metadata can be unavailable while offline; keep the local record.
  }

  const status = api.getStatus();

  return {
    ...account,
    username,
    npub: identity.npub,
    address: getNpcAddress(username, identity.npub),
    isDefault: account.id === NPC_DEFAULT_ACCOUNT_ID,
    isRunning: status.isRunning,
    isSyncing: status.isSyncing,
  };
}

export function NpcProvider({ children }: { children: React.ReactNode }) {
  const manager = useManager();
  const [storedAccounts, setStoredAccounts] = useState<IStoredNpcAccount[]>([]);
  const [accounts, setAccounts] = useState<INpcAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const reloadAccounts = useCallback(
    async (nextAccounts?: IStoredNpcAccount[]) => {
      const loaded = nextAccounts || (await loadStoredAccounts());
      const hydrated = await Promise.all(loaded.map((account) => hydrateAccount(manager, account)));
      setStoredAccounts(loaded);
      setAccounts(hydrated);
    },
    [manager],
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeAccounts() {
      setIsLoading(true);
      try {
        const loaded = await loadStoredAccounts();
        const hydrated = await Promise.all(
          loaded.map((account) => hydrateAccount(manager, account)),
        );

        if (!cancelled) {
          setStoredAccounts(loaded);
          setAccounts(hydrated);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeAccounts();

    return () => {
      cancelled = true;
    };
  }, [manager]);

  const addAccount = useCallback(async () => {
    const nextIndex =
      storedAccounts.reduce((max, account) => Math.max(max, account.accountIndex), 0) + 1;
    const nextAccount: IStoredNpcAccount = {
      id: `npc-seed-${nextIndex}`,
      accountIndex: nextIndex,
      label: `Account ${nextIndex + 1}`,
    };
    const nextAccounts = [...storedAccounts, nextAccount];
    await saveStoredAccounts(nextAccounts);
    await reloadAccounts(nextAccounts);
  }, [reloadAccounts, storedAccounts]);

  const removeAccount = useCallback(
    async (accountId: string) => {
      if (accountId === NPC_DEFAULT_ACCOUNT_ID) {
        throw new Error("The default account cannot be removed.");
      }

      setBusyAccountId(accountId);
      try {
        await removeNpcAccount(manager, accountId);
        const nextAccounts = storedAccounts.filter((account) => account.id !== accountId);
        await saveStoredAccounts(nextAccounts);
        await reloadAccounts(nextAccounts);
      } finally {
        setBusyAccountId(null);
      }
    },
    [manager, reloadAccounts, storedAccounts],
  );

  const refreshAccount = useCallback(
    async (accountId: string) => {
      setBusyAccountId(accountId);
      try {
        await reloadAccounts(storedAccounts);
      } finally {
        setBusyAccountId(null);
      }
    },
    [reloadAccounts, storedAccounts],
  );

  const syncAccount = useCallback(
    async (accountId: string) => {
      setBusyAccountId(accountId);
      try {
        await syncNpcAccount(manager, accountId);
        await reloadAccounts(storedAccounts);
      } finally {
        setBusyAccountId(null);
      }
    },
    [manager, reloadAccounts, storedAccounts],
  );

  const syncAll = useCallback(async () => {
    setBusyAccountId("all");
    try {
      await getNpcExtension(manager).syncAll();
      await reloadAccounts(storedAccounts);
    } finally {
      setBusyAccountId(null);
    }
  }, [manager, reloadAccounts, storedAccounts]);

  const saveUsername = useCallback(
    async (accountId: string, username: string) => {
      const trimmed = username.trim();
      if (!isValidNpcUsername(trimmed) || trimmed.length === 0) {
        throw new Error("Use 3-32 letters, numbers, dots, dashes, or underscores.");
      }

      const account = storedAccounts.find((item) => item.id === accountId);
      if (!account) {
        throw new Error("NPC account not found.");
      }

      setBusyAccountId(accountId);
      try {
        await setNpcUsernameWithLocalBalance(manager, account, trimmed);
        const nextAccounts = storedAccounts.map((item) =>
          item.id === accountId ? { ...item, username: trimmed } : item,
        );
        await saveStoredAccounts(nextAccounts);
        await reloadAccounts(nextAccounts);
      } finally {
        setBusyAccountId(null);
      }
    },
    [manager, reloadAccounts, storedAccounts],
  );

  const value = useMemo(
    () => ({
      accounts,
      isLoading,
      busyAccountId,
      addAccount,
      removeAccount,
      refreshAccount,
      syncAccount,
      syncAll,
      saveUsername,
    }),
    [
      accounts,
      addAccount,
      busyAccountId,
      isLoading,
      refreshAccount,
      removeAccount,
      saveUsername,
      syncAccount,
      syncAll,
    ],
  );

  return <NpcCtx.Provider value={value}>{children}</NpcCtx.Provider>;
}

export function useNpcContext() {
  const ctx = useContext(NpcCtx);
  if (!ctx) {
    throw new Error("useNpcContext must be used within NpcProvider");
  }
  return ctx;
}
