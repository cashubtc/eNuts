import de from "@assets/translations/de.json";
import en from "@assets/translations/en.json";
import es from "@assets/translations/es.json";
import it from "@assets/translations/it.json";
import ru from "@assets/translations/ru.json";
import th from "@assets/translations/th.json";
import { l } from "@log";
import { isErr } from "@util";
import { getTranslationLangCode } from "@util/localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * Enumerates namespaces for usage in translations.
 */
export enum NS {
  common = "common",
  auth = "auth",
  wallet = "wallet",
  topNav = "topNav",
  bottomNav = "bottomNav",
  error = "error",
  history = "history",
  mints = "mints",
  backup = "backup",
  addrBook = "addrBook",
}

export const defaultNS = NS.common;
export const resources = {
  en,
  de,
  es,
  it,
  ru,
  th,
} as const;

/**
 * Config and Init i18n library
 */
i18n
  .use(initReactI18next)
  .init({
    // compatibilityJSON: 'v3',
    cleanCode: true,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    defaultNS,
    ns: [
      NS.common,
      NS.auth,
      NS.wallet,
      NS.topNav,
      NS.bottomNav,
      NS.error,
      NS.history,
      NS.mints,
      NS.backup,
      NS.addrBook,
    ],
    lng: getTranslationLangCode(),
    // debug,
    // Consider external storing of translations and fetch needed language on demand
    // https://www.i18next.com/how-to/backend-fallback
    resources,
  })
  .catch((e) => {
    l({
      i18nextError: isErr(e) ? e.message : "Error while initializing i18next",
    });
  });

export default i18n;
