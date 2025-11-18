import * as FileSystem from "expo-file-system";

import { secureStore, store } from "./store";
import { SECRET, SECURESTORE_KEY, STORE_KEYS } from "./store/consts";
import { db } from "./db/database";
import { deleteDatabaseSync } from "expo-sqlite";
import dbProvider from "./DbProvider";
import { seedService } from "@src/services/SeedService";

export async function dropAllData() {
  await dbProvider.delete();
  await store.clear();
  await seedService.deleteMnemonic();
  await secureStore.delete(SECRET);
  await secureStore.delete(SECURESTORE_KEY);
  await secureStore.delete(STORE_KEYS.seed);
  db.db.closeSync();
  deleteDatabaseSync("cashu.db");
  const cacheDir = new FileSystem.Directory(FileSystem.Paths.cache);
  const documentDir = new FileSystem.Directory(FileSystem.Paths.document);
  documentDir.delete();
  cacheDir.delete();
}
