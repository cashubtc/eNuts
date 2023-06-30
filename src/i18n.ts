
import { isReactNativeDevMode as debug } from '@consts'
import { l } from '@log'
// import { SimpleKeyValueStore } from '@store/SimpleKeyValueStore'
import { isErr } from '@util'
import { getLanguageCode } from '@util/localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './translations/de.json'
import en from './translations/en.json'

// type ModuleType = 'backend'
// 	| 'logger'
// 	| 'languageDetector'
// 	| 'postProcessor'
// 	| 'i18nFormat'
// 	| 'formatter'
// 	| '3rdParty'

// interface ILangDetector {
// 	type: ModuleType
// 	async: boolean
// 	detect: () => Promise<string>
// 	init: () => void
// }

// const languageDetector: ILangDetector = {
// 	type: 'languageDetector',
// 	async: true,
// 	detect: async () => {
// 		const langStore = new SimpleKeyValueStore('lang')
// 		const storedLang = await langStore.get('lang')
// 		if (storedLang?.length) {
// 			return storedLang
// 		}
// 		return getLanguageCode()
// 	},
// 	init: () => { l('init detector') },
// }

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
			de: { translation: de }
		},
	}).catch(e => {
		l({ i18nextError: isErr(e) ? e.message : 'Error while initializing i18next' })
	})

export default i18n