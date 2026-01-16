import { copyStrToClipboard } from "@src/util";
import { useCallback, useRef, useState } from "react";

export default function useCopy() {
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    timerId.current = null;
  }, []);

  const copy = useCallback(
    async (s: string) => {
      await copyStrToClipboard(s);
      setCopied(true);
      if (timerId.current) {
        clearTimer();
      }
      timerId.current = setTimeout(() => {
        setCopied(false);
        clearTimer();
      }, 3000);
    },
    [clearTimer],
  );

  return {
    copied,
    copy,
  };
}
