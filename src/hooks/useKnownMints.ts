import { l } from "@src/logger";
import { KnownMint, mintRepository } from "@src/storage/db/repo/MintRepository";
import { knownMintsEvents } from "@src/util/events";
import { mintService } from "@src/wallet/services/MintService";
import { useState, useEffect } from "react";

const useKnownMints = () => {
    const [knownMints, setKnownMints] = useState<KnownMint[]>([]);

    useEffect(() => {
        async function getKnownMints() {
            try {
                const knownMints = await mintService.getAllKnownMints();
                console.log("knownMints", knownMints);
                setKnownMints(knownMints);
            } catch (error) {
                l(error);
            }
        }
        getKnownMints();
        knownMintsEvents.on("knownMintsUpdated", getKnownMints);
        return () => {
            knownMintsEvents.off("knownMintsUpdated", getKnownMints);
        };
    }, []);
    return knownMints;
};

export default useKnownMints;
