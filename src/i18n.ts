
import de from '@assets/translations/de.json'
import en from '@assets/translations/en.json'
import es from '@assets/translations/es.json'
import fr from '@assets/translations/fr.json'
import hu from '@assets/translations/hu.json'
import it from '@assets/translations/it.json'
import ru from '@assets/translations/ru.json'
import sw from '@assets/translations/sw.json'
import th from '@assets/translations/th.json'
import zh_tr from '@assets/translations/zh-Hans-CN.json'
import zh_si from '@assets/translations/zh-Hant-TW.json'
import { l } from '@log'
import { isErr } from '@util'
import { getTranslationLangCode } from '@util/localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/**
 * Enumerates namespaces for usage in translations.
 */
export enum NS {
	common = 'common',
	auth = 'auth',
	wallet = 'wallet',
	topNav = 'topNav',
	bottomNav = 'bottomNav',
	error = 'error',
	history = 'history',
	mints = 'mints',
	backup = 'backup',
	addrBook = 'addrBook'
}

export const defaultNS = NS.common
export const resources = {
	en, de, fr, sw, es, hu, it, ru, th, 'zh-Hans-CN': zh_tr, 'zh-Hant-TW': zh_si
} as const

/**
 * Config and Init i18n library
 */
i18n.use(initReactI18next)
	.init({
		// compatibilityJSON: 'v3',
		cleanCode: true,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false
		},
		defaultNS,
		ns: [NS.common, NS.auth, NS.wallet, NS.topNav, NS.bottomNav, NS.error, NS.history, NS.mints, NS.backup, NS.addrBook],
		lng: getTranslationLangCode(),
		// debug,
		// Consider external storing of translations and fetch needed language on demand
		// https://www.i18next.com/how-to/backend-fallback
		resources,
	}).catch(e => {
		l({ i18nextError: isErr(e) ? e.message : 'Error while initializing i18next' })
	})

export default i18n