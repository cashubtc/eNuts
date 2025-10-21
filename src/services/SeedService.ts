import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as SecureStore from "expo-secure-store";
import { privateKeyFromSeedWords } from "nostr-tools/nip06";

class SeedService {
  private _seed: Uint8Array | null = null;
  createNewMnemonic() {
    const mnemonic = bip39.generateMnemonic(wordlist);
    SecureStore.setItem("mnemonic", mnemonic);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    this._seed = seed;
    return mnemonic;
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

  ensureMnemonicSet() {
    const savedMnemonic = this.getMnemonic();
    if (!savedMnemonic) {
      this.createNewMnemonic();
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
}

export const seedService = new SeedService();
