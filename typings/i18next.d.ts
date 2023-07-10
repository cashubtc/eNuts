// import the original type declarations
import 'i18next'

import { defaultNS, resources } from '../src/i18n'

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS
		resources: typeof resources
	}
}