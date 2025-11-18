import { SecureStore } from "./SecureStore";
import Storage from "expo-sqlite/kv-store";

class Store {
  async set(key: string, value: string) {
    await Storage.setItemAsync(key, value);
  }
  async get(key: string) {
    return await Storage.getItemAsync(key);
  }
  async delete(key: string) {
    await Storage.removeItemAsync(key);
  }
  async clear() {
    await Storage.clearAsync();
  }
}

const store = new Store();

const secureStore = new SecureStore();

export { secureStore, store };
