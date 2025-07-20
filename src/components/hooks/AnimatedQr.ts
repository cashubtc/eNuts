import { useEffect, useState } from "react";
import { UR, UREncoder } from "@gandlaf21/bc-ur";

export const useAnimatedQr = (payload: string) => {
    const [chunk, setChunk] = useState<string>(payload || "");

    useEffect(() => {
        if (!payload) {
            setChunk("");
            return;
        }

        // Start with the original payload for immediate display
        setChunk(payload);

        try {
            const messageBuffer = new TextEncoder().encode(payload);
            const ur = UR.from(messageBuffer);
            const encoder = new UREncoder(ur, 200, 0);

            const timer = setInterval(() => {
                const nextChunk = encoder.nextPart();
                setChunk(nextChunk);
            }, 500);

            return () => clearInterval(timer);
        } catch (error) {
            // If UR encoding fails, fall back to original payload
            console.warn("UR encoding failed, using original payload:", error);
            setChunk(payload);
        }
    }, [payload]);

    return chunk || payload;
};
