import { FiveMins, MinuteInS } from "@consts/time";
import { isNull, isStr } from "@util";
import { hash256 } from "@util/crypto";
import {
  clearBgTimestamp,
  clearLock,
  deletePinHash,
  getBgTimestamp,
  getLock,
  getPinHash,
  setBgTimestamp,
  setLock,
  setPinHash,
} from "./pinStorage";
import type { IAttemptsState } from "./types";

export async function hasPin(): Promise<boolean> {
  const pin = await getPinHash();
  return !isNull(pin) && isStr(pin) && pin.length > 0;
}

export async function verifyPin(plain: string): Promise<boolean> {
  const pin = await getPinHash();
  if (isNull(pin)) return false;
  return hash256(plain) === pin;
}

export async function setPin(plain: string): Promise<void> {
  const h = hash256(plain);
  await Promise.all([setPinHash(h), clearLock()]);
}

export async function removePin(): Promise<void> {
  await deletePinHash();
}

export function computeNextAttempts(prev: IAttemptsState): IAttemptsState {
  const maxMismatchReached = prev.mismatchCount + 1 === 3;
  const increasedLockedCount = prev.lockedCount + 1;
  return {
    mismatch: true,
    mismatchCount: maxMismatchReached ? 0 : prev.mismatchCount + 1,
    locked: maxMismatchReached,
    lockedCount: maxMismatchReached ? increasedLockedCount : prev.lockedCount,
    lockedTime: maxMismatchReached
      ? MinuteInS * Math.pow(increasedLockedCount, 2)
      : prev.lockedTime,
  };
}

export async function persistLock(attempts: IAttemptsState): Promise<void> {
  const now = Math.ceil(Date.now() / 1000);
  await setLock({ ...attempts, timestamp: now });
}

export async function loadLock(): Promise<IAttemptsState | null> {
  const lock = await getLock();
  if (!lock) return null;
  const now = Math.ceil(Date.now() / 1000);
  const secsPassed = now - lock.timestamp;
  const lockedTime = Math.max(0, lock.lockedTime - secsPassed);
  const { timestamp: _ts, ...rest } = lock;
  return { ...rest, mismatch: false, lockedTime };
}

export async function setBackgroundNow(): Promise<void> {
  const now = Math.ceil(Date.now() / 1000);
  await setBgTimestamp(now);
}

export async function needsReauth(): Promise<boolean> {
  const pin = await getPinHash();
  if (isNull(pin)) return false;
  const ts = await getBgTimestamp();
  if (ts === null) return false;
  const now = Math.ceil(Date.now() / 1000);
  return now - ts > FiveMins;
}

export async function clearReauth(): Promise<void> {
  await clearBgTimestamp();
}

export async function clearLockState(): Promise<void> {
  await clearLock();
}
