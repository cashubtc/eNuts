import { getLocales as gl, locale } from 'expo-localization'

const _translationLangCodes = ['de', 'en', 'fr'] as const
type TranslationLangCodes = typeof _translationLangCodes[number]
export const translationLangCodes:Readonly<string[]> = [..._translationLangCodes] 

export function getLocales() { return gl() }
export function getLanguageCode() { return locale.split('-')[0] }
export function getTranslationLangCode() {
	const lang = getLanguageCode()
	return (translationLangCodes.includes(lang) ? lang : 'en') as TranslationLangCodes
}