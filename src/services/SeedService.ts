import * as bip39 from "@scure/bip39";
import * as Crypto from "expo-crypto";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as SecureStore from "expo-secure-store";
import { privateKeyFromSeedWords } from "nostr-tools/nip06";

class SeedService {
  private _seed: Uint8Array | null = null;
  async createNewMnemonic(): Promise<{
    mnemonic: string;
    fingerprint: string;
  }> {
    const mnemonic = bip39.generateMnemonic(wordlist);
    SecureStore.setItem("mnemonic", mnemonic);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    this._seed = seed;
    const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, mnemonic);
    return { mnemonic, fingerprint };
  }

  async deleteMnemonic() {
    return SecureStore.deleteItemAsync("mnemonic");
  }

  setMnemonic(mnemonic: string) {
    this._seed = bip39.mnemonicToSeedSync(mnemonic);
  }

  getMnemonic() {
    return SecureStore.getItem("mnemonic");
  }

  isMnemonicSet() {
    return SecureStore.getItem("mnemonic") !== null;
  }

  async getFingerprint() {
    const mnemonic = this.getMnemonic();
    if (!mnemonic) {
      return null;
    }
    const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, mnemonic);
    return fingerprint;
  }
  async ensureMnemonicSet() {
    const savedMnemonic = this.getMnemonic();
    if (!savedMnemonic) {
      await this.createNewMnemonic();
    }
  }

  getSeed() {
    if (this._seed) {
      return this._seed;
    }
    const mnemonic = SecureStore.getItem("mnemonic");
    if (!mnemonic) {
      throw new Error("No mnemonic found");
    }
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    this._seed = seed;
    return seed;
  }

  async getNostrSk() {
    const mnemonic = await this.getMnemonic();
    if (!mnemonic) {
      throw new Error("No mnemonic found");
    }
    const sk = privateKeyFromSeedWords(mnemonic);
    return sk;
  }
  convertMnemonicToSeed(mnemonic: string) {
    return bip39.mnemonicToSeedSync(mnemonic);
  }
}

export const seedService = new SeedService();
