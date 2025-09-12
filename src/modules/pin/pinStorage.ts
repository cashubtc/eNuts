import { secureStore, store } from "@store";
import { SECURESTORE_KEY, STORE_KEYS } from "@store/consts";

export async function getPinHash(): Promise<string | null> {
  return secureStore.get(SECURESTORE_KEY);
}

export async function setPinHash(hash: string): Promise<void> {
  await secureStore.set(SECURESTORE_KEY, hash);
}

export async function deletePinHash(): Promise<void> {
  await secureStore.delete(SECURESTORE_KEY);
}

type LockStored = {
  mismatch: boolean;
  mismatchCount: number;
  locked: boolean;
  lockedCount: number;
  lockedTime: number;
  timestamp: number;
};

export async function getLock(): Promise<LockStored | null> {
  return store.getObj<LockStored>(STORE_KEYS.lock);
}

export async function setLock(lock: LockStored): Promise<void> {
  await store.setObj(STORE_KEYS.lock, lock);
}

export async function clearLock(): Promise<void> {
  await store.delete(STORE_KEYS.lock);
}

export async function getBgTimestamp(): Promise<number | null> {
  const v = await store.get(STORE_KEYS.bgCounter);
  if (!v) return null;
  const n = +v;
  return Number.isFinite(n) ? n : null;
}

export async function setBgTimestamp(tsSec: number): Promise<void> {
  await store.set(STORE_KEYS.bgCounter, `${tsSec}`);
}

export async function clearBgTimestamp(): Promise<void> {
  await store.delete(STORE_KEYS.bgCounter);
}
