import { useCallback, useMemo, useRef, useState } from "react";
import { UR, URDecoder } from "@gandlaf21/bc-ur";

type UseUrDecoderOptions = {
  allowedTypes?: string[];
};

type AddPartResult = {
  accepted: boolean;
  complete: boolean;
  progress: number; // 0..1 based on received/expected
  estimated: number; // 0..1 estimated percent complete including duplicates handling
};

export function useUrDecoder(options: UseUrDecoderOptions = {}) {
  const { allowedTypes = ["bytes"] } = options;

  const decoderRef = useRef<URDecoder>(new URDecoder());
  const [active, setActive] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [estimated, setEstimated] = useState(0);
  const [expectedCount, setExpectedCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [lastIndexes, setLastIndexes] = useState<number[]>([]);
  const [resultUr, setResultUr] = useState<UR | undefined>(undefined);
  const [decodedString, setDecodedString] = useState<string | undefined>(
    undefined
  );

  const reset = useCallback(() => {
    decoderRef.current = new URDecoder();
    setActive(false);
    setComplete(false);
    setError(undefined);
    setProgress(0);
    setEstimated(0);
    setExpectedCount(0);
    setReceivedCount(0);
    setLastIndexes([]);
    setResultUr(undefined);
    setDecodedString(undefined);
  }, []);

  const addPart = useCallback(
    (part: string): AddPartResult => {
      // Accept only UR parts
      const lower = part.trim().toLowerCase();
      if (!lower.startsWith("ur:")) {
        return {
          accepted: false,
          complete: false,
          progress: decoderRef.current.getProgress?.() ?? 0,
          estimated: decoderRef.current.estimatedPercentComplete?.() ?? 0,
        };
      }

      // Validate allowed types on the first part
      try {
        const [type] = URDecoder.parse(lower);
        if (allowedTypes.length && !allowedTypes.includes(type)) {
          return {
            accepted: false,
            complete: false,
            progress,
            estimated,
          };
        }
      } catch (e) {
        // Parse error: ignore silently
        return {
          accepted: false,
          complete: false,
          progress: decoderRef.current.getProgress?.() ?? 0,
          estimated: decoderRef.current.estimatedPercentComplete?.() ?? 0,
        };
      }

      setActive(true);

      try {
        decoderRef.current.receivePart(lower);

        const isComplete = decoderRef.current.isComplete();
        const newProgress = decoderRef.current.getProgress();
        const newEstimated = decoderRef.current.estimatedPercentComplete();
        const newExpected = decoderRef.current.expectedPartCount();
        const newReceived = decoderRef.current.receivedPartIndexes().length;
        const newLast = decoderRef.current.lastPartIndexes();

        setProgress(newProgress);
        setEstimated(newEstimated);
        setExpectedCount(newExpected);
        setReceivedCount(newReceived);
        setLastIndexes(newLast);

        if (decoderRef.current.isError()) {
          setError(decoderRef.current.resultError());
          setActive(false);
        }

        if (isComplete) {
          const ur = decoderRef.current.resultUR();
          setResultUr(ur);
          try {
            const decoded = ur.decodeCBOR();
            // @ts-ignore RN Buffer polyfill supports toString
            const asString: string = decoded.toString();
            setDecodedString(asString);
          } catch (e) {
            // If decoding fails, leave decodedString undefined
          }
          setComplete(true);
          setActive(false);
        }

        return {
          accepted: true,
          complete: isComplete,
          progress: newProgress,
          estimated: newEstimated,
        };
      } catch (e: any) {
        setError(e?.message || "Decode error");
        setActive(false);
        return {
          accepted: false,
          complete: false,
          progress: decoderRef.current.getProgress?.() ?? 0,
          estimated: decoderRef.current.estimatedPercentComplete?.() ?? 0,
        };
      }
    },
    [allowedTypes]
  );

  return useMemo(
    () => ({
      addPart,
      reset,
      active,
      complete,
      error,
      progress,
      estimated,
      expectedCount,
      receivedCount,
      lastIndexes,
      resultUr,
      decodedString,
    }),
    [
      addPart,
      reset,
      active,
      complete,
      error,
      progress,
      estimated,
      expectedCount,
      receivedCount,
      lastIndexes,
      resultUr,
      decodedString,
    ]
  );
}
