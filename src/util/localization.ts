import { getLocales as gl, locale } from 'expo-localization'

export function getLocales() {
	return gl()
}
export function getLanguageCode() {
	return locale.split('-')[0]
}
