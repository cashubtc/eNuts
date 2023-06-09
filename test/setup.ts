// we always make sure 'react-native' gets included first
// import * as ReactNative from "react-native"
import { getDatabase } from './wrapper/getTestDb'

// libraries to mock
// jest.doMock("react-native", () => { return ReactNative })
jest.mock('expo-sqlite', () => ({
	get openDatabase() {
		return (_: string) => getDatabase(':memory:')
	}
}))

jest.mock('expo-constants', () => ({}))
jest.mock('expo-secure-store', () => ({}))
jest.mock('@bugsnag/expo', () => ({}))
jest.mock('expo-localization', () => ({}))
jest.mock('reactotron-react-native', () => ({}))
jest.mock('react-native', () => ({}))
// jest.mock('@consts', () => ({}))
jest.mock('expo/config', () => ({}))

/* jest.doMock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
) */

declare global { const __TEST__ = true }
