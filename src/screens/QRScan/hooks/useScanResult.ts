import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUrDecoder } from "@comps/hooks/useUrDecoder";

type ScanResultType = "LIGHTNING_INVOICE" | "CASHU_TOKEN" | "UNKNOWN";

type ScanResult = {
  type: ScanResultType;
  content: string;
};

function parseScannerContent(content: string): ScanResult {
  const trimmed = content.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized.startsWith("lnbc")) {
    return { type: "LIGHTNING_INVOICE", content: trimmed };
  }
  if (normalized.startsWith("lightning:")) {
    return { type: "LIGHTNING_INVOICE", content: trimmed.slice(10) };
  }
  if (normalized.startsWith("cashua") || normalized.startsWith("cashub")) {
    return { type: "CASHU_TOKEN", content: trimmed };
  }
  if (normalized.startsWith("cashu:")) {
    return { type: "CASHU_TOKEN", content: trimmed.slice(6) };
  }

  return { type: "UNKNOWN", content: "" };
}

const useScanResult = () => {
  const {
    addPart,
    reset: resetUr,
    active: urActive,
    complete: urComplete,
    estimated,
    expectedCount,
    receivedCount,
    decodedString,
    error: urError,
  } = useUrDecoder({ allowedTypes: ["bytes"] });

  const [result, setResult] = useState<ScanResult | undefined>(undefined);
  const handledRef = useRef(false);

  const reset = useCallback(() => {
    handledRef.current = false;
    setResult(undefined);
    resetUr();
  }, [resetUr]);

  // When UR completes, parse the decoded string
  useEffect(() => {
    if (!urComplete || !decodedString || handledRef.current) return;
    const parsed = parseScannerContent(decodedString);
    setResult(parsed);
    handledRef.current = true;
  }, [urComplete, decodedString]);

  const onScan = useCallback(
    (data: string) => {
      if (handledRef.current) return;

      const content = String(data || "");
      const lower = content.trim().toLowerCase();

      if (lower.startsWith("ur:")) {
        const { accepted } = addPart(content);
        if (accepted) {
          // Keep scanning to accumulate parts
          return;
        }
        // Fall through to normal parsing if not accepted
      }

      const parsed = parseScannerContent(content);
      setResult(parsed);
      handledRef.current = true;
    },
    [addPart]
  );

  const complete = useMemo(() => Boolean(result), [result]);
  const active = urActive;
  const error = urError;

  return {
    onScan,
    reset,
    active,
    complete,
    estimated,
    expectedCount,
    receivedCount,
    error,
    result,
  };
};

export default useScanResult;
