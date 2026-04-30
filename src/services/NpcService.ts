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
import { finalizeEvent, getPublicKey } from "nostr-tools/pure";
import { decode, npubEncode } from "nostr-tools/nip19";

import { appLogger } from "@src/logger";
import { seedService } from "@src/services/SeedService";
import { secureStore, store } from "@store";

export const NPC_BASE_URL = "https://npubx.cash";
export const NPC_DOMAIN = new URL(NPC_BASE_URL).host;
export const NPC_SYNC_INTERVAL_MS = 25_000;
export const NPC_DEFAULT_ACCOUNT_ID = "npc-seed-0";

export type TNpcAccountSource = "seed" | "privateKey";

interface IBaseStoredNpcAccount {
  id: string;
  label: string;
  username?: string;
}

export interface ISeedNpcAccount extends IBaseStoredNpcAccount {
  source: "seed";
  accountIndex: number;
}

export interface IPrivateKeyNpcAccount extends IBaseStoredNpcAccount {
  source: "privateKey";
  privateKeyStorageKey: string;
}

export type IStoredNpcAccount = ISeedNpcAccount | IPrivateKeyNpcAccount;

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
    source: "seed",
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

export function getNpcPrivateKeyStorageKey(accountId: string) {
  return `npc_private_key:${accountId}`;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeHexPrivateKey(hex: string) {
  const normalized = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Private key must be a 64-character hex key or nsec.");
  }
  return normalized;
}

function hexToBytes(hex: string) {
  const normalized = normalizeHexPrivateKey(hex);
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function normalizeNpcPrivateKey(input: string) {
  const trimmed = input.trim();
  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith("nsec1")) {
    const decoded = decode(normalized);
    if (decoded.type !== "nsec") {
      throw new Error("Private key must be a valid nsec.");
    }
    return bytesToHex(decoded.data);
  }
  return normalizeHexPrivateKey(trimmed);
}

async function getSeedNpcIdentity(accountIndex: number): Promise<INpcIdentity> {
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

async function getPrivateKeyNpcIdentity(privateKeyStorageKey: string): Promise<INpcIdentity> {
  const savedKey = await secureStore.get(privateKeyStorageKey);
  if (!savedKey) {
    throw new Error("NPC private key not found.");
  }

  const privateKey = hexToBytes(savedKey);
  const signer: Signer = async (template) => finalizeEvent(template, privateKey);
  const publicKey = getPublicKey(privateKey);

  return {
    signer,
    publicKey,
    npub: npubEncode(publicKey),
  };
}

export async function getNpcIdentity(account: IStoredNpcAccount): Promise<INpcIdentity> {
  if (account.source === "privateKey") {
    return getPrivateKeyNpcIdentity(account.privateKeyStorageKey);
  }
  return getSeedNpcIdentity(account.accountIndex);
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
  const identity = await getNpcIdentity(account);
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
  const identity = await getNpcIdentity(account);
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
