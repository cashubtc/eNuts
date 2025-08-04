import { Proof } from "@cashu/cashu-ts";
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

    /**
     * Set the state of multiple proofs.
     * @param proofsOrSecrets Array of proof objects or secrets to update.
     * @param state The new state to set.
     */
    async setProofsState(
        proofsOrSecrets: string[] | Proof[] | EnutsProof[],
        state: EnutsProof["state"]
    ) {
        const secrets = this.extractSecrets(proofsOrSecrets);
        const res = await this.proofRepo.updateProofsState(secrets, state);
        proofEvents.emit("proofsUpdated", null);
        return res;
    }

    /**
     * Get a single proof by secret or proof object.
     * @param proofOrSecret Proof object or secret string.
     */
    async getProof(proofOrSecret: string | Proof | EnutsProof) {
        const secret = this.extractSecret(proofOrSecret);
        return this.proofRepo.getProof(secret);
    }

    /**
     * Delete a single proof by secret or proof object.
     * @param proofOrSecret Proof object or secret string.
     */
    async deleteProof(proofOrSecret: string | Proof | EnutsProof) {
        const secret = this.extractSecret(proofOrSecret);
        const res = await this.proofRepo.deleteProof(secret);
        proofEvents.emit("proofsUpdated", null);
        return res;
    }

    /**
     * Delete multiple proofs.
     * @param proofsOrSecrets Array of proof objects or secrets to delete.
     */
    async deleteProofs(proofsOrSecrets: string[] | Proof[] | EnutsProof[]) {
        const secrets = this.extractSecrets(proofsOrSecrets);
        const res = await this.proofRepo.deleteProofsBySecrets(secrets);
        proofEvents.emit("proofsUpdated", null);
        return res;
    }

    /**
     * Update a single proof.
     * @param proofOrSecret Proof object or secret string to identify the proof.
     * @param updates Partial proof updates.
     */
    async updateProof(
        proofOrSecret: string | Proof | EnutsProof,
        updates: Partial<Proof>
    ) {
        const secret = this.extractSecret(proofOrSecret);
        const res = await this.proofRepo.updateProof(secret, updates);
        proofEvents.emit("proofsUpdated", null);
        return res;
    }

    /**
     * Extract secret from a proof object or return the string if it's already a secret.
     */
    private extractSecret(proofOrSecret: string | Proof | EnutsProof): string {
        if (typeof proofOrSecret === "string") {
            return proofOrSecret;
        }
        return proofOrSecret.secret;
    }

    /**
     * Extract secrets from an array of proof objects or return the array if it's already secrets.
     */
    private extractSecrets(
        proofsOrSecrets: string[] | Proof[] | EnutsProof[]
    ): string[] {
        if (proofsOrSecrets.length === 0) return [];

        // Check if first element is a string to determine the type
        if (typeof proofsOrSecrets[0] === "string") {
            return proofsOrSecrets as string[];
        }

        // Extract secrets from proof objects
        return (proofsOrSecrets as (Proof | EnutsProof)[]).map(
            (proof) => proof.secret
        );
    }
}

export const proofService = new ProofService(proofRepository);
