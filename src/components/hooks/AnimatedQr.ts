import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { UR, UREncoder } from "@gandlaf21/bc-ur";

type AnimatedQrOptions = {
  intervalMs?: number;
  maxFragmentLen?: number;
  startWithUr?: boolean;
  animate?: boolean;
  minLengthToAnimate?: number;
};

export const useAnimatedQr = (
  payload: string,
  options: AnimatedQrOptions = {}
): string => {
  const {
    intervalMs = 250,
    maxFragmentLen = 200,
    startWithUr = true,
    animate = true,
    minLengthToAnimate = 150,
  } = options;

  const [chunk, setChunk] = useState<string>(payload || "");

  useFocusEffect(
    useCallback(() => {
      if (!payload) {
        setChunk("");
        return;
      }

      const shouldAnimate = animate && payload.length >= minLengthToAnimate;
      if (!shouldAnimate) {
        setChunk(payload);
        return;
      }

      try {
        const messageBuffer =
          typeof TextEncoder !== "undefined"
            ? new TextEncoder().encode(payload)
            : new Uint8Array([...payload].map((c) => c.charCodeAt(0)));

        const ur = UR.from(messageBuffer);
        const encoder = new UREncoder(ur, maxFragmentLen, 0);

        setChunk(startWithUr ? encoder.nextPart() : payload);

        const timer = setInterval(() => {
          const nextChunk = encoder.nextPart();
          setChunk(nextChunk);
        }, intervalMs);

        return () => {
          console.log("clearing timer");
          clearInterval(timer);
        };
      } catch (error) {
        // Fall back to original payload if UR encoding fails
        // Guard dev-only logging to avoid noise in production
        try {
          // @ts-ignore - __DEV__ is provided by React Native envs
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            // eslint-disable-next-line no-console
            console.warn("UR encoding failed, using original payload:", error);
          }
        } catch (_) {
          // no-op
        }
        setChunk(payload);
      }
    }, [
      payload,
      intervalMs,
      maxFragmentLen,
      startWithUr,
      animate,
      minLengthToAnimate,
    ])
  );

  return chunk || payload;
};
