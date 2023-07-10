
import de from '@assets/translations/de.json'
import en from '@assets/translations/en.json'
import fr from '@assets/translations/fr.json'
import { isReactNativeDevMode as debug } from '@consts'
import { l } from '@log'
import { isErr } from '@util'
import { getLanguageCode } from '@util/localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const defaultNS = 'common'
export const resources = {
	en: {
		common: en.common,
		wallet: en.wallet,
		topNav: en.topNav,
		bottomNav: en.bottomNav,
		error: en.error,
		history: en.history,
		mints: en.mints,
		backup: en.backup,
		addrBook: en.addrBook,
		auth: en.auth,
	},
	de: {
		common: de.common,
		wallet: de.wallet,
		topNav: de.topNav,
		bottomNav: de.bottomNav,
		error: de.error,
		history: de.history,
		mints: de.mints,
		backup: de.backup,
		addrBook: de.addrBook,
		auth: de.auth,
	},
	fr: {
		common: fr.common,
		wallet: fr.wallet,
		topNav: fr.topNav,
		bottomNav: fr.bottomNav,
		error: fr.error,
		history: fr.history,
		mints: fr.mints,
		backup: fr.backup,
		addrBook: fr.addrBook,
		auth: fr.auth,
	}
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
		ns: ['common', 'wallet', 'topNav', 'bottomNav', 'error', 'history', 'mints', 'backup', 'addrBook', 'auth'],
		lng: getLanguageCode(),
		debug,
		// Consider external storing of translations and fetch needed language on demand
		// https://www.i18next.com/how-to/backend-fallback
		resources,
	}).catch(e => {
		l({ i18nextError: isErr(e) ? e.message : 'Error while initializing i18next' })
	})

export default i18n