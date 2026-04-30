import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUrDecoder } from "@comps/hooks/useUrDecoder";
import { parsePaymentString, type PaymentStringCandidate } from "@util/paymentStringParser";

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

  const [candidates, setCandidates] = useState<PaymentStringCandidate[] | undefined>(undefined);
  const handledRef = useRef(false);

  const reset = useCallback(() => {
    handledRef.current = false;
    setCandidates(undefined);
    resetUr();
  }, [resetUr]);

  // When UR completes, parse the decoded string
  useEffect(() => {
    if (!urComplete || !decodedString || handledRef.current) return;
    setCandidates(parsePaymentString(decodedString));
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

      setCandidates(parsePaymentString(content));
      handledRef.current = true;
    },
    [addPart],
  );

  const complete = useMemo(() => Boolean(candidates), [candidates]);
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
    candidates,
  };
};

export default useScanResult;
