import { useEffect, useMemo, useState } from "react";
import { usePinAuth } from "@src/modules/pin/PinProvider";
import {
  computeNextAttempts,
  persistLock,
  removePin as svcRemovePin,
  setPin as svcSetPin,
  verifyPin as svcVerifyPin,
} from "@src/modules/pin/PinService";
import { vib } from "@util";

export type AuthMode = "unlock" | "setup" | "edit" | "remove";
export type AuthPhase = "unlock" | "setup" | "confirm" | "success";

export type AuthResult =
  | { type: "unlocked" }
  | { type: "pin_set" }
  | { type: "pin_removed" }
  | { type: "skipped" };

export function usePinEntry(mode: AuthMode, onFinish: (r: AuthResult) => void) {
  const { attempts, setAttempts } = usePinAuth();

  const initialPhase: AuthPhase = useMemo(() => {
    if (mode === "unlock" || mode === "edit" || mode === "remove")
      return "unlock";
    return "setup";
  }, [mode]);

  const [phase, setPhase] = useState<AuthPhase>(initialPhase);
  const [pinInput, setPinInput] = useState<number[]>([]);
  const [confirmInput, setConfirmInput] = useState<number[]>([]);

  const mismatch = attempts.mismatch;
  const remainingLockSec = attempts.lockedTime;
  const isLocked = attempts.locked && phase !== "confirm";

  const canSubmit = useMemo(() => {
    if (isLocked) return false;
    if (phase === "unlock" || phase === "setup") return pinInput.length >= 4;
    if (phase === "confirm") return confirmInput.length >= 4;
    return false;
  }, [phase, isLocked, pinInput.length, confirmInput.length]);

  const backspace = () => {
    if (isLocked || phase === "success") return;
    if (phase === "confirm") {
      setConfirmInput((prev) => prev.slice(0, -1));
      return;
    }
    setPinInput((prev) => prev.slice(0, -1));
  };

  const enterDigit = (n: number) => {
    if (isLocked || phase === "success") return;
    if (n === 10) return backspace();
    if (n === 11) return void submit();
    if (phase === "confirm") {
      setConfirmInput((prev) => (prev.length >= 12 ? prev : [...prev, n]));
      return;
    }
    setPinInput((prev) => (prev.length >= 12 ? prev : [...prev, n]));
  };

  const handleMismatch = async () => {
    const next = computeNextAttempts(attempts);
    if (next.locked) vib(500);
    if (phase !== "confirm") {
      await persistLock(next);
    }
    setAttempts(next);
    // Reset after a short delay
    const t = setTimeout(() => {
      setConfirmInput([]);
      if (phase === "confirm" && next.locked) {
        setPinInput([]);
        setPhase(initialPhase);
      }
      setPinInput([]);
      setAttempts((prev) => ({
        ...prev,
        mismatch: false,
        locked: phase === "confirm" ? prev.locked : prev.locked,
      }));
      clearTimeout(t);
    }, 1000);
  };

  const submit = async () => {
    if (!canSubmit) return false;
    const pinStr = pinInput.join("");

    if (phase === "unlock") {
      const ok = await svcVerifyPin(pinStr);
      if (!ok) {
        await handleMismatch();
        return false;
      }
      setPinInput([]);
      if (mode === "remove") {
        await svcRemovePin();
        setPhase("success");
        onFinish({ type: "pin_removed" });
        return true;
      }
      if (mode === "edit") {
        setPhase("setup");
        return true;
      }
      setPhase("success");
      onFinish({ type: "unlocked" });
      return true;
    }

    if (phase === "setup") {
      setPhase("confirm");
      return true;
    }

    if (phase === "confirm") {
      const confirmStr = confirmInput.join("");
      if (confirmStr !== pinStr) {
        await handleMismatch();
        return false;
      }
      await svcSetPin(pinStr);
      setPhase("success");
      onFinish({ type: "pin_set" });
      return true;
    }

    return false;
  };

  const skip = () => {
    // Only meaningful in setup/confirm phases
    if (phase === "setup" || phase === "confirm") {
      onFinish({ type: "skipped" });
    }
  };

  const cancel = () => {
    onFinish({ type: "skipped" });
  };

  // lock countdown remains managed in provider; no timer here

  return {
    phase,
    pinInput,
    confirmInput,
    mismatch,
    isLocked,
    remainingLockSec,
    canSubmit,
    enterDigit,
    backspace,
    submit,
    skip,
    cancel,
  };
}
