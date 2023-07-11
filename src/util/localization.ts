import { type TranslationLangCodes, translationLangCodes } from '@model/i18n'
import { getLocales as gl, locale } from 'expo-localization'

export function getLocales() { return gl() }
export function getLanguageCode() { return locale.split('-')[0] }

export function getTranslationLangCode() {
	const lang = getLanguageCode()
	return (translationLangCodes.includes(lang) ? lang : 'en') as TranslationLangCodes
}