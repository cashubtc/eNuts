/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Balance from '@comps/Balance'
import { initDb } from '@db'
import { fireEvent, render, screen } from '@testing-library/react-native'

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}))

describe('Basic test of the Txt.tsx component', () => {
	// eslint-disable-next-line no-return-await
	beforeAll(async () => await initDb())
	// Clear all mock function calls before each test
	beforeEach(() => jest.clearAllMocks())
	// Start tests
	it('renders the expected string', () => {
		render(<Balance />)
		const textElement = screen.getByText('0')
		expect(textElement).toBeDefined()
	})
	it('updates the balance format state on press', () => {
		render(<Balance />)
		const touchableElement = screen.getByText('0')
		// Simulate press event
		fireEvent.press(touchableElement)
		expect(screen.getByText('0.00000000')).toBeDefined()
	})
})