// we always make sure 'react-native' gets included first
// eslint-disable-next-line simple-import-sort/imports
import 'react-native'

import type { Locale } from 'expo-localization'

import { getDatabase } from './wrapper/getTestDb'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@assets/translations/en.json'
import { NS } from '@src/i18n'

process.env.NODE_ENV = 'test'
// eslint-disable-next-line @typescript-eslint/no-floating-promises
i18n.use(initReactI18next).init({
	lng: 'en',
	defaultNS: NS.common,
	ns: [NS.common, NS.auth, NS.wallet, NS.topNav, NS.bottomNav, NS.error, NS.history, NS.mints, NS.backup, NS.addrBook],
	resources: { en },
})

// libraries to mock
// jest.mock('react-native', () => jest.requireActual<typeof import('react-native')>('react-native'))

jest.mock('expo-sqlite/legacy', () => ({
	get openDatabase() {
		return (_: string) => getDatabase(':memory:')
	}
}))

jest.mock('expo-constants', () => ({}))
jest.mock('expo-secure-store', () => ({}))
jest.mock('expo-localization', () => ({
	locale: 'en-US',
	getLgetLocales: () => {
		const arr: Locale[] = []
		return arr
	}
}))
// jest.mock('react-native', () => ({}))
// jest.mock('@consts', () => ({}))
jest.mock('expo/config', () => ({}))

// jest.doMock('@react-native-async-storage/async-storage', () =>
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
// 	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
// )

declare global { const __TEST__ = true }
