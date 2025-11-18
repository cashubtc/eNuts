import * as FileSystem from "expo-file-system";
import Storage from "expo-sqlite/kv-store";

import { secureStore, store } from "./store";
import { SECRET, SECURESTORE_KEY, STORE_KEYS } from "./store/consts";
import dbProvider from "./DbProvider";
import { seedService } from "@src/services/SeedService";

export async function dropAllData() {
  await dbProvider.delete();
  Storage.clear();
  await store.clear();
  await seedService.deleteMnemonic();
  await secureStore.delete(SECRET);
  await secureStore.delete(SECURESTORE_KEY);
  await secureStore.delete(STORE_KEYS.seed);
  const cacheDir = new FileSystem.Directory(FileSystem.Paths.cache);
  const documentDir = new FileSystem.Directory(FileSystem.Paths.document);
  documentDir.delete();
  cacheDir.delete();
}
