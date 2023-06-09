import Balance from '@comps/Balance'
import { initDb } from '@src/storage/db'
import { fireEvent,render,screen } from '@testing-library/react-native'

describe('Basic test of the Txt.tsx component', () => {
	// eslint-disable-next-line no-return-await
	beforeAll(async () => await initDb())
	// Clear all mock function calls before each test
	beforeEach(() => jest.clearAllMocks())
	// Start tests
	it('renders the expected string', () => {
		render(<Balance balance={69} />)
		const textElement = screen.getByText('69')
		expect(textElement).toBeDefined()
	})
	it('updates the balance format state on press', () => {
		render(<Balance balance={69} />)
		const touchableElement = screen.getByText('69')
		// Simulate press event
		fireEvent.press(touchableElement)
		expect(touchableElement.props.children).toBe('0.00000069')
	})
})
