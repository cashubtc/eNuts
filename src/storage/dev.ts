import * as FileSystem from "expo-file-system";

import { historyStore, secureStore, store } from "./store";
import { SECRET, SECURESTORE_KEY, STORE_KEYS } from "./store/consts";
import { db } from "./db/database";
import { deleteDatabaseSync } from "expo-sqlite";

export async function dropAllData() {
    await store.clear();
    await secureStore.delete(SECRET);
    await secureStore.delete(SECURESTORE_KEY);
    await secureStore.delete(STORE_KEYS.seed);
    await historyStore.clear();
    db.db.closeSync();
    const res = deleteDatabaseSync("cashu.db");
    console.log("res", res);
    await FileSystem.deleteLegacyDocumentDirectoryAndroid();
    await FileSystem.deleteAsync(FileSystem.cacheDirectory!);
    await FileSystem.deleteAsync(FileSystem.documentDirectory!);
}
