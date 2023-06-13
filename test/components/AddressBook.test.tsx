/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AddressBook from '@comps/pages/Addressbook/Book'
// import { initDb } from '@db'
import { act, fireEvent, render, screen } from '@testing-library/react-native'

jest.useFakeTimers()

describe('Test the Addressbook page', () => {
	// eslint-disable-next-line no-return-await
	// beforeAll(async () => await initDb())
	// Clear all mock function calls before each test
	beforeEach(() => jest.clearAllMocks())
	// Start tests
	it('Render the address book page', () => {
		render(<AddressBook />)
		expect(screen).toBeDefined()
	})
	it('Render the new contact modal', () => {
		render(<AddressBook />)
		fireEvent.press(screen.getByTestId('testNewContact'))
		const modalHeader = screen.getByText('New contact')
		expect(modalHeader).toBeDefined()
	})
	it('Shows an error popup on empty LNURL input', () => {
		render(<AddressBook />)
		fireEvent.press(screen.getByTestId('testNewContact'))
		fireEvent.press(screen.getByText('Save'))
		expect(screen.getByText('Invalid LNURL!')).toBeDefined()
		act(() => jest.runAllTimers())
	})
	it('Shows an error popup on empty name input', () => {
		render(<AddressBook />)
		fireEvent.press(screen.getByTestId('testNewContact'))
		// Mock LNURL input
		fireEvent.changeText(screen.getByPlaceholderText('zap@me.now'), 'zap@me.now')
		fireEvent.press(screen.getByText('Save'))
		expect(screen.getByText('Invalid name!')).toBeDefined()
		act(() => jest.runAllTimers())
	})
	// TODO test the functionality of adding a new contact and rendering it
	// eslint-disable-next-line jest/no-commented-out-tests
	// it('Render the new contact', async () => {
	// 	render(<AddressBook />)
	// 	fireEvent.press(screen.getByTestId('testNewContact'))
	// 	// Mock name input
	// 	fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Test contact')
	// 	// Mock LNURL input
	// 	fireEvent.changeText(screen.getByPlaceholderText('zap@me.now'), 'zap@me.test')
	// 	fireEvent.press(screen.getByText('Save'))
	// 	// await addContact({
	// 	// 	name: 'Test contact',
	// 	// 	ln: 'zap@me.test',
	// 	// 	isOwner: false
	// 	// })
	// 	// await getContacts()
	// 	// await sleep(2000)
	// 	// Check if the circle with the names first char is rendered
	// 	expect(screen.getByText('T')).toBeDefined()
	// })
})
