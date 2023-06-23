/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AddressBook from '@comps/screens/Addressbook/Book'
import AddressbookModal from '@comps/screens/Addressbook/modal'
import { l } from '@src/logger'
import { act, fireEvent, render, screen } from '@testing-library/react-native'

jest.useFakeTimers()

describe('Test the Addressbook page', () => {
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
	it('Does not show the name input if adding personal LNURL', () => {
		render(<AddressBook />)
		fireEvent.press(screen.getByTestId('addPersonal'))
		expect(screen.queryByPlaceholderText('Name')).toBeNull()
	})
	it('Addressbook modal has a specific style applied', () => {
		render(
			<AddressbookModal
				closeModal={() => l('test')}
				setInput={() => l('test')}
			/>
		)
		const modal = screen.getByTestId('testCoinSelectionModal')
		expect(modal.props.children.props.children.props.style[0].paddingHorizontal).toBe(0)
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
