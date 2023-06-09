import Success from '@comps/Success'
import { NavigationContainer } from '@react-navigation/native'
import { fireEvent, render, screen } from '@testing-library/react-native'
// {
// 	amount: number
// 	fee?: number
// 	mints?: string[]
// 	mint?: string
// 	memo?: string
// 	nav?: NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>
// 	hash?: string
// }
// Mock the navigation object
const mockNavigation = {
	navigate: jest.fn(),
}

// Mock the NavigationContainer
jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => mockNavigation,
}))

describe('Basic test of the Success.tsx component', () => {
	it('renders the success screen for payment from the mint to a LN wallet', () => {
		render(
			<NavigationContainer>
				<Success
					amount={21}
					fee={0}
					mints={['test-mint']}
				/>
			</NavigationContainer>
		)
		const textElement = screen.getByText('Payment successfull!')
		expect(textElement).toBeDefined()
	})
	it('renders the success screen for minting new tokens', () => {
		render(
			<NavigationContainer>
				<Success
					amount={21}
					hash='test-hash'
					mint='test-mint'
				/>
			</NavigationContainer>
		)
		const textElement = screen.getByText('21 Satoshi minted!')
		expect(textElement).toBeDefined()
	})
	it('renders the success screen after claiming a new token', () => {
		render(
			<NavigationContainer>
				<Success
					amount={21}
					mints={['test-mint']}
					memo='Just a test'
				/>
			</NavigationContainer>
		)
		const textElement = screen.getByText('21 Satoshi claimed!')
		expect(textElement).toBeDefined()
		const memo = screen.getByText('Just a test')
		expect(memo).toBeDefined()
	})
	// it('navigates to a specific screen', () => {
	// 	render(
	// 		<NavigationContainer>
	// 			<Success
	// 				amount={21}
	// 				mints={['test-mint']}
	// 				memo='Just a test'
	// 			/>
	// 		</NavigationContainer>
	// 	)
	// 	const pressElement = screen.getByText('Back to dashboard')
	// 	fireEvent.press(pressElement)
	// 	const expectedComponent = screen.getByTestId('dashboard')
	// 	// Verify if the expected component is rendered
	// 	expect(expectedComponent).toBeDefined()
	// 	// Verify if the navigate function was called with the correct screen name
	// 	expect(mockNavigation.navigate).toHaveBeenCalledWith('dashboard')
	// })
})
