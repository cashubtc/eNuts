import { l } from "@log";
import type { IPreferences, IPreferencesResp } from "@model";
import { isObj } from "@util";

import { db } from "./database";

// ################################ Preferences ################################
export async function getPreferences(): Promise<IPreferences> {
  const prefs = await db.first<IPreferencesResp>(
    "SELECT * FROM preferences limit 1"
  );
  l("[getPreferences]", prefs);
  return {
    id: prefs?.id || 1,
    darkmode: prefs?.darkmode === "true",
    theme: prefs?.theme || "Default",
    formatBalance: prefs?.formatBalance === "true",
    hasPref: isObj(prefs),
  };
}
export async function setPreferences(p: IPreferences) {
  const result = await db.run(
    "INSERT OR REPLACE INTO preferences (id, theme,darkmode,formatBalance) VALUES (?, ?,?, ?)",
    [1, p.theme, p.darkmode.toString(), p.formatBalance.toString()]
  );
  l("[setPreferences]", result);
  return result?.changes === 1;
}

// ################################ Re-exports from migrations.ts ################################
