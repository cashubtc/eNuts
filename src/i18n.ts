
import { isReactNativeDevMode as debug } from '@consts'
import { l } from '@log'
import { isErr } from '@util'
import { getLanguageCode } from '@util/localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './translations/de.json'
import en from './translations/en.json'
import fr from './translations/fr.json'

i18n.use(initReactI18next)
	// .use(languageDetector)
	.init({
		compatibilityJSON: 'v3',
		cleanCode: true,
		fallbackLng: 'en',
		lng: getLanguageCode(),
		debug,
		// Consider external storing of translations and fetch needed language on demand
		// https://www.i18next.com/how-to/backend-fallback
		resources: {
			en: { translation: en },
			de: { translation: de },
			fr: { translation: fr },
		},
	}).catch(e => {
		l({ i18nextError: isErr(e) ? e.message : 'Error while initializing i18next' })
	})

export default i18n