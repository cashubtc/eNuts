
import { isReactNativeDevMode as debug } from '@consts'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { l } from './logger'
import de from './translations/de.json'
import en from './translations/en.json'
import { isErr } from './util'
import { getLanguageCode } from './util/localization'

i18n.use(initReactI18next).init({
	compatibilityJSON: 'v3',
	cleanCode: true,
	fallbackLng: 'en',
	lng: getLanguageCode(),
	debug,
	// Consider external storing of translations and fetch needed language on demand
	// https://www.i18next.com/how-to/backend-fallback
	resources: {
		en: { translation: en },
		de: { translation: de }
	},
}).catch(e => {
	l({i18nextError: isErr(e) ? e.message : 'Error while initializing i18next'})
})

export default i18n