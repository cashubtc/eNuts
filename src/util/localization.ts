import { type TranslationLangCodes, translationLangCodes } from '@model/i18n'
import { getLocales as gl, locale } from 'expo-localization'

/**
 * Retrieves the available locales using the Expo Localization module.
 */
export function getLocales() {
	return gl()
}

/**
 * Retrieves the primary language code from the current locale.
 */
export function getLanguageCode() {
	return locale.split('-')[0]
}

/**
 * Retrieves the translation language code based on the primary language code.
 * If the primary language code is not supported, 'en' (English) is returned as the default.
 */
export function getTranslationLangCode() {
	const lang = getLanguageCode()
	return (translationLangCodes.includes(lang) ? lang : 'en') as TranslationLangCodes
}