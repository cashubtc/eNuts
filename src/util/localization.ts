import { type TranslationLangCodes, translationLangCodes } from "@model/i18n";
import { getLocales } from "expo-localization";

/**
 * Retrieves the primary language code from the current locale.
 */
export function getLanguageCode() {
  const locales = getLocales();
  return locales[0].languageCode?.split("-")[0] ?? "en";
}

/**
 * Retrieves the translation language code based on the primary language code.
 * If the primary language code is not supported, 'en' (English) is returned as the default.
 */
export function getTranslationLangCode() {
  const lang = getLanguageCode();
  return (translationLangCodes.includes(lang) ? lang : "en") as TranslationLangCodes;
}
