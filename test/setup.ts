// we always make sure 'react-native' gets included first
// eslint-disable-next-line simple-import-sort/imports
import * as ReactNative from 'react-native'

import { Locale } from 'expo-localization'

import { getDatabase } from './wrapper/getTestDb'

// libraries to mock
jest.doMock('react-native', () => ReactNative)
jest.mock('expo-sqlite', () => ({
	get openDatabase() {
		return (_: string) => getDatabase(':memory:')
	}
}))

jest.mock('expo-constants', () => ({}))
jest.mock('expo-secure-store', () => ({}))
jest.mock('@bugsnag/expo', () => ({}))
jest.mock('expo-localization', () => ({
	locale: 'de',
	getLgetLocales: () => {
		const arr: Locale[] = []
		return arr
	}
}))
jest.mock('reactotron-react-native', () => ({}))
// jest.mock('react-native', () => ({}))
// jest.mock('@consts', () => ({}))
jest.mock('expo/config', () => ({}))

jest.doMock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

declare global { const __TEST__ = true }
