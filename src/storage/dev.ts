import * as FileSystem from "expo-file-system";

import { dropAll } from "./db";
import { historyStore, secureStore, store } from "./store";
import { SECRET, SECURESTORE_KEY, STORE_KEYS } from "./store/consts";

export async function dropAllData() {
    await Promise.all([
        dropAll(),
        store.clear(),
        secureStore.delete(SECRET),
        secureStore.delete(SECURESTORE_KEY),
        secureStore.delete(STORE_KEYS.seed),
        historyStore.clear(),
        FileSystem.deleteLegacyDocumentDirectoryAndroid(),
        FileSystem.deleteAsync(FileSystem.cacheDirectory!),
        FileSystem.deleteAsync(FileSystem.documentDirectory!),
    ]);
}
