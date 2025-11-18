import type { IPreferences, IPreferencesResp } from "@model";
import Storage from "expo-sqlite/kv-store";

import { STORE_KEYS } from "../store/consts";

export function getPreferences(): IPreferences {
  const theme = Storage.getItemSync(STORE_KEYS.theme);
  if (!theme) {
    return {
      id: 1,
      mode: "auto",
      theme: "Default",
      formatBalance: false,
      hasPref: false,
    };
  }
  const parsed = JSON.parse(theme) as IPreferences;
  return parsed;
}
export function setPreferences(p: IPreferences) {
  Storage.setItemSync(STORE_KEYS.theme, JSON.stringify(p));
}
