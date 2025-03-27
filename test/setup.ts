// we always make sure 'react-native' gets included first
import 'react-native'

// import type { Locale } from 'expo-localization'

// import i18n from 'i18next'
// import { initReactI18next } from 'react-i18next'

// import en from '@assets/translations/en.json'
// import { NS } from '@src/i18n'

// i18n.use(initReactI18next).init({
// 	lng: 'en',
// 	defaultNS: NS.common,
// 	ns: [NS.common, NS.auth, NS.wallet, NS.topNav, NS.bottomNav, NS.error, NS.history, NS.mints, NS.backup, NS.addrBook],
// 	resources: { en },
// })

// jest.mock('expo-constants', () => ({}))
// jest.mock('expo-secure-store', () => ({}))
// jest.mock('expo-localization', () => ({
// 	locale: 'en-US',
// 	getLgetLocales: () => {
// 		const arr: Locale[] = []
// 		return arr
// 	}
// }))
// jest.mock('expo/config', () => ({}))

declare global { const __TEST__ = true }
