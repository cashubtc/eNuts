import type { Manager, Plugin } from "@cashu/coco-core";
import { getEncodedToken } from "@cashu/coco-core";
import {
  NPCPlugin,
  type NPCAccountApi,
  type NPCPluginApi,
  type SinceStore,
  type Signer,
} from "coco-cashu-plugin-npc";
import { JWTAuthProvider, NPCClient, PaymentRequiredError } from "npubcash-sdk";
import { accountFromSeedWords } from "nostr-tools/nip06";
import { finalizeEvent } from "nostr-tools/pure";
import { npubEncode } from "nostr-tools/nip19";

import { appLogger } from "@src/logger";
import { seedService } from "@src/services/SeedService";
import { store } from "@store";

export const NPC_BASE_URL = "https://npubx.cash";
export const NPC_DOMAIN = new URL(NPC_BASE_URL).host;
export const NPC_SYNC_INTERVAL_MS = 25_000;
export const NPC_DEFAULT_ACCOUNT_ID = "npc-seed-0";

export interface IStoredNpcAccount {
  id: string;
  accountIndex: number;
  label: string;
  username?: string;
}

export interface INpcIdentity {
  signer: Signer;
  publicKey: string;
  npub: string;
}

interface INpcManager extends Manager {
  ext: Manager["ext"] & {
    npc?: NPCPluginApi;
  };
}

class StoreSinceStore implements SinceStore {
  constructor(private readonly key: string) {}

  async get() {
    const saved = await store.get(this.key);
    const parsed = saved ? Number(saved) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async set(since: number) {
    await store.set(this.key, String(since));
  }

  async clear() {
    await store.delete(this.key);
  }
}

export function createNpcPlugin(): Plugin {
  return new NPCPlugin({
    defaultBaseUrl: NPC_BASE_URL,
    syncIntervalMs: NPC_SYNC_INTERVAL_MS,
    useWebsocket: true,
    logger: appLogger.child({ name: "NPCPlugin" }),
  }) as unknown as Plugin;
}

export function createDefaultNpcAccount(): IStoredNpcAccount {
  return {
    id: NPC_DEFAULT_ACCOUNT_ID,
    accountIndex: 0,
    label: "Main account",
  };
}

export function isValidNpcUsername(username: string) {
  const trimmed = username.trim();
  return trimmed.length === 0 || /^[a-zA-Z0-9_.-]{3,32}$/.test(trimmed);
}

export function getNpcAddress(username: string | undefined, npub: string) {
  const localPart = username?.trim() || npub;
  return `${localPart}@${NPC_DOMAIN}`;
}

export function getNpcSinceStore(accountId: string) {
  return new StoreSinceStore(`npc_since:${accountId}`);
}

export async function getNpcIdentity(accountIndex: number): Promise<INpcIdentity> {
  const mnemonic = await seedService.getMnemonic();
  if (!mnemonic) {
    throw new Error("No mnemonic found");
  }
  const account = accountFromSeedWords(mnemonic, undefined, accountIndex);
  const signer: Signer = async (template) => finalizeEvent(template, account.privateKey);

  return {
    signer,
    publicKey: account.publicKey,
    npub: npubEncode(account.publicKey),
  };
}

export function getNpcExtension(manager: Manager) {
  const npc = (manager as INpcManager).ext.npc;
  if (!npc) {
    throw new Error("NPC plugin is not registered");
  }
  return npc;
}

export async function registerNpcAccount(manager: Manager, account: IStoredNpcAccount) {
  const npc = getNpcExtension(manager);
  const identity = await getNpcIdentity(account.accountIndex);
  const existing = npc.getAccount(account.id);

  if (existing) {
    return {
      api: existing,
      identity,
    };
  }

  const api = await npc.addAccount({
    id: account.id,
    signer: identity.signer,
    baseUrl: NPC_BASE_URL,
    sinceStore: getNpcSinceStore(account.id),
    syncIntervalMs: NPC_SYNC_INTERVAL_MS,
    useWebsocket: true,
    autoStart: true,
  });

  return {
    api,
    identity,
  };
}

export async function removeNpcAccount(manager: Manager, accountId: string) {
  const npc = getNpcExtension(manager);
  await npc.removeAccount(accountId);
  await getNpcSinceStore(accountId).clear();
}

export async function syncNpcAccount(manager: Manager, accountId: string) {
  const npc = getNpcExtension(manager);
  const account = npc.getAccount(accountId);
  if (!account) {
    throw new Error("NPC account is not registered");
  }
  await account.sync();
}

export async function getNpcAccountInfo(api: NPCAccountApi) {
  return api.getInfo();
}

export async function setNpcUsernameWithLocalBalance(
  manager: Manager,
  account: IStoredNpcAccount,
  username: string,
) {
  const identity = await getNpcIdentity(account.accountIndex);
  const client = new NPCClient(NPC_BASE_URL, new JWTAuthProvider(NPC_BASE_URL, identity.signer));

  try {
    await client.setUsername(username);
    return;
  } catch (error) {
    if (!(error instanceof PaymentRequiredError)) {
      throw error;
    }

    const encodedRequest = error.paymentRequest.toEncodedRequest();
    const request = await manager.paymentRequests.parse(encodedRequest);
    const mintUrl = request.payableMints[0];

    if (!mintUrl) {
      throw new Error("No local mint can pay for this username.");
    }

    const transaction = await manager.paymentRequests.prepare(request, {
      mintUrl,
      amount: request.amount,
    });
    const result = await manager.paymentRequests.execute(transaction);

    if (result.type !== "inband") {
      throw new Error("NPC username purchase did not return an in-band token.");
    }

    await client.setUsername(username, getEncodedToken(result.token));
  }
}
