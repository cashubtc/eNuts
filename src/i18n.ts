
import de from '@assets/translations/de.json'
import en from '@assets/translations/en.json'
import fr from '@assets/translations/fr.json'
import { isReactNativeDevMode as debug } from '@consts'
import { l } from '@log'
import { isErr } from '@util'
import { getTranslationLangCode } from '@util/localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const defaultNS = 'common'
export const resources = {
	en, de, fr
} as const

i18n.use(initReactI18next)
	.init({
		compatibilityJSON: 'v3',
		cleanCode: true,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false
		},
		defaultNS,
		ns: ['common', 'auth', 'wallet', 'topNav', 'bottomNav', 'error', 'history', 'mints', 'backup', 'addrBook'],
		lng: getTranslationLangCode(),
		debug,
		// Consider external storing of translations and fetch needed language on demand
		// https://www.i18next.com/how-to/backend-fallback
		resources,
	}).catch(e => {
		l({ i18nextError: isErr(e) ? e.message : 'Error while initializing i18next' })
	})

export default i18n