const _tlLangNames = [
  "english",
  "german",
  "french",
  "swahili",
  "spanish",
  "hungarian",
  "italian",
  "russian",
  "thai",
  "chinese traditional",
  "chinese simplified",
] as const;
export type TTlLangNames = (typeof _tlLangNames)[number];

const _translationLangCodes = [
  "de",
  "en",
  "fr",
  "sw",
  "es",
  "hu",
  "it",
  "ru",
  "th",
  "zh-Hant-TW",
  "zh-Hans-CN",
] as const;
export type TranslationLangCodes = (typeof _translationLangCodes)[number];
export const translationLangCodes: readonly string[] = [..._translationLangCodes];

export interface ILangsOpt {
  name: TTlLangNames;
  code: TranslationLangCodes;
  flag: string;
}
