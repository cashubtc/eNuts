import type { Manager } from "@cashu/coco-core";
import { useManager } from "@src/context/Manager";
import {
  createDefaultNpcAccount,
  getNpcAccountInfo,
  getNpcAddress,
  getNpcExtension,
  getNpcPrivateKeyStorageKey,
  isValidNpcUsername,
  type IStoredNpcAccount,
  NPC_DEFAULT_ACCOUNT_ID,
  normalizeNpcPrivateKey,
  registerNpcAccount,
  removeNpcAccount,
  setNpcUsernameWithLocalBalance,
  syncNpcAccount,
} from "@src/services/NpcService";
import { secureStore, store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

export type INpcAccount = IStoredNpcAccount & {
  npub: string;
  address: string;
  isDefault: boolean;
  isRunning: boolean;
  isSyncing: boolean;
};

interface INpcContext {
  accounts: INpcAccount[];
  isLoading: boolean;
  busyAccountId: string | null;
  deriveAccount: () => Promise<void>;
  importPrivateKeyAccount: (privateKey: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  refreshAccount: (accountId: string) => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  saveUsername: (accountId: string, username: string) => Promise<void>;
}

const NpcCtx = createContext<INpcContext | null>(null);

function sortAccounts(accounts: IStoredNpcAccount[]) {
  return [...accounts].sort((a, b) => {
    if (a.id === NPC_DEFAULT_ACCOUNT_ID) return -1;
    if (b.id === NPC_DEFAULT_ACCOUNT_ID) return 1;
    if (a.source === "seed" && b.source === "seed") {
      return a.accountIndex - b.accountIndex;
    }
    if (a.source === "seed") return -1;
    if (b.source === "seed") return 1;
    return a.id.localeCompare(b.id);
  });
}

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
      .map((account): IStoredNpcAccount | null => {
        if (!account || typeof account.id !== "string" || typeof account.label !== "string") {
          return null;
        }

        if (
          (account.source === "seed" || account.source === undefined) &&
          typeof account.accountIndex === "number"
        ) {
          return {
            id: account.id,
            source: "seed",
            accountIndex: account.accountIndex,
            label: account.label,
            username: typeof account.username === "string" ? account.username : undefined,
          };
        }

        if (account.source === "privateKey" && typeof account.privateKeyStorageKey === "string") {
          return {
            id: account.id,
            source: "privateKey",
            privateKeyStorageKey: account.privateKeyStorageKey,
            label: account.label,
            username: typeof account.username === "string" ? account.username : undefined,
          };
        }

        return null;
      })
      .filter((account): account is IStoredNpcAccount => account !== null);

    if (!accounts.some((account) => account.id === NPC_DEFAULT_ACCOUNT_ID)) {
      accounts.unshift(createDefaultNpcAccount());
    }

    return sortAccounts(accounts.length ? accounts : [createDefaultNpcAccount()]);
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
  await store.set(STORE_KEYS.npcAccounts, JSON.stringify(sortAccounts(accounts)));
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

  const deriveAccount = useCallback(async () => {
    const nextIndex =
      storedAccounts.reduce(
        (max, account) => (account.source === "seed" ? Math.max(max, account.accountIndex) : max),
        0,
      ) + 1;
    const nextAccount: IStoredNpcAccount = {
      id: `npc-seed-${nextIndex}`,
      source: "seed",
      accountIndex: nextIndex,
      label: `Account ${nextIndex + 1}`,
    };
    const nextAccounts = [...storedAccounts, nextAccount];
    await saveStoredAccounts(nextAccounts);
    await reloadAccounts(nextAccounts);
  }, [reloadAccounts, storedAccounts]);

  const importPrivateKeyAccount = useCallback(
    async (privateKey: string) => {
      const normalizedPrivateKey = normalizeNpcPrivateKey(privateKey);
      const importedCount = storedAccounts.filter(
        (account) => account.source === "privateKey",
      ).length;
      const accountId = `npc-key-${Date.now()}`;
      const privateKeyStorageKey = getNpcPrivateKeyStorageKey(accountId);
      const nextAccount: IStoredNpcAccount = {
        id: accountId,
        source: "privateKey",
        privateKeyStorageKey,
        label: `Imported account ${importedCount + 1}`,
      };
      const nextAccounts = [...storedAccounts, nextAccount];

      await secureStore.set(privateKeyStorageKey, normalizedPrivateKey);
      await saveStoredAccounts(nextAccounts);
      await reloadAccounts(nextAccounts);
    },
    [reloadAccounts, storedAccounts],
  );

  const removeAccount = useCallback(
    async (accountId: string) => {
      if (accountId === NPC_DEFAULT_ACCOUNT_ID) {
        throw new Error("The default account cannot be removed.");
      }

      setBusyAccountId(accountId);
      try {
        const account = storedAccounts.find((item) => item.id === accountId);
        await removeNpcAccount(manager, accountId);
        if (account?.source === "privateKey") {
          await secureStore.delete(account.privateKeyStorageKey);
        }
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
      deriveAccount,
      importPrivateKeyAccount,
      removeAccount,
      refreshAccount,
      syncAccount,
      syncAll,
      saveUsername,
    }),
    [
      accounts,
      busyAccountId,
      deriveAccount,
      importPrivateKeyAccount,
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
