/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import Success from '@comps/Success'
import type Nav from '@react-navigation/native'
import { NavigationContainer } from '@react-navigation/native'
import { fireEvent, render, screen } from '@testing-library/react-native'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../../assets/translations/en.json'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
i18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	resources: {
		en: { translation: en }
	},
})

const mockedNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual<typeof Nav>('@react-navigation/native'),
	useNavigation: () => ({ navigate: mockedNavigate })
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
	it('navigates to a specific screen', () => {
		render(
			<NavigationContainer>
				<Success
					amount={21}
					mints={['test-mint']}
					memo='Just a test'
				/>
			</NavigationContainer>
		)
		// Press the button
		fireEvent.press(screen.getByText('Back to dashboard'))

		// Verify if the navigate function was called
		expect(mockedNavigate).toHaveBeenCalledTimes(1)
		// Verify if the navigate function was called with the correct screen name
		expect(mockedNavigate).toHaveBeenCalledWith('dashboard')

		// const expectedComponent = screen.getByTestId('dashboard')
		// // Verify if the expected component is rendered
		// expect(expectedComponent).toBeDefined()
	})
})
