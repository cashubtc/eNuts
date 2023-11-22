const _tlLangNames = [
	'english',
	'german',
	'french',
	'swahili',
	'spanish',
] as const
export type TTlLangNames = typeof _tlLangNames[number]

const _translationLangCodes = ['de', 'en', 'fr', 'sw', 'es'] as const
export type TranslationLangCodes = typeof _translationLangCodes[number]
export const translationLangCodes:Readonly<string[]> = [..._translationLangCodes]

export interface ILangsOpt {
	name: TTlLangNames
	code: TranslationLangCodes
}