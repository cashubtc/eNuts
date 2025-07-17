import {
    EnutsProof,
    proofRepository,
    ProofRepository,
} from "@src/storage/db/repo/ProofRepository";
import { proofEvents } from "@src/util/events";

export class ProofService {
    private proofRepo: ProofRepository;

    constructor(proofRepo: ProofRepository) {
        this.proofRepo = proofRepo;
    }

    async getBalance() {
        return this.proofRepo.getReadyProofsAmount();
    }

    async getProofsByMintUrl(mintUrl: string) {
        return this.proofRepo.getProofsByMintUrl(mintUrl);
    }

    async getProofsByState(state: EnutsProof["state"]) {
        return this.proofRepo.getProofsByState(state);
    }
    async addProofs(proofs: EnutsProof[]) {
        const res = await this.proofRepo.saveProofs(proofs);
        proofEvents.emit("proofsUpdated", null);
        return res;
    }
}

export const proofService = new ProofService(proofRepository);
