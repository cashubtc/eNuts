import Balance from '@comps/Balance'
import { render, fireEvent } from '@testing-library/react-native'
import { Locale } from 'expo-localization'

// Mock the expo-sqlite openDatabase method
jest.mock('expo-sqlite', () => ({
	openDatabase: () => ({
		transaction: (callback: (tx: any) => void) => {
			const mockExecuteSql = jest.fn()
			const mockTx = { executeSql: mockExecuteSql }
			callback(mockTx)
		},
	}),
}))
// Mock the expo-localization
jest.mock('expo-localization', () => {
	return {
		locale: 'de',
		getLgetLocales: () => {
			const arr: Locale[] = []
			return arr
		}
	}
})
describe('Basic test of the Txt.tsx component', () => {
	// Clear all mock function calls before each test
	beforeEach(() => jest.clearAllMocks())
	// Start tests
	it('renders the expected string', () => {
		const { getByText } = render(<Balance balance={69} />)
		const textElement = getByText('69')
		expect(textElement).toBeDefined()
	})
	it('updates the balance format state on press', () => {
		const { getByText } = render(<Balance balance={69} />)
		const touchableElement = getByText('69')
		// Simulate press event
		fireEvent.press(touchableElement)
		expect(touchableElement.props.children).toBe('0.00000069')
	})
})
