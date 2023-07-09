// import the original type declarations
import "i18next"

import de from '@assets/translations/de.json'
import en from '@assets/translations/en.json'
import fr from '@assets/translations/fr.json'


declare module 'i18next' {
	interface CustomTypeOptions {
		resources: {
			en: typeof en,
			de: typeof de,
			fr: typeof fr,
		};
	}
}

