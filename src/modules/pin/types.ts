import type { Dispatch, SetStateAction } from "react";

export interface IAttemptsState {
  mismatch: boolean;
  mismatchCount: number;
  locked: boolean;
  lockedCount: number;
  lockedTime: number;
}

export interface IPinContextValue {
  ready: boolean;
  hasPin: boolean;
  needsAuth: boolean;
  attempts: IAttemptsState;
  setAttempts: Dispatch<SetStateAction<IAttemptsState>>;
  clearNeedsAuth: () => void;
  refreshHasPin: () => Promise<void>;
}

export type TAuthMode = "unlock" | "setup" | "edit" | "remove";
