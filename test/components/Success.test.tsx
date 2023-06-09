import Success from '@comps/Success'
import { formatInt } from '@src/util'
import { render } from '@testing-library/react-native'
import { Locale } from 'expo-localization'
// {
// 	amount: number
// 	fee?: number
// 	mints?: string[]
// 	mint?: string
// 	memo?: string
// 	nav?: NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>
// 	hash?: string
// }
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
describe('Basic test of the Success.tsx component', () => {
	it('renders the success screen for payment from the mint to a LN wallet', () => {
		const { getByText } = render(
			<Success
				amount={21}
				fee={0}
				mints={['test-mint']}
			/>
		)
		const textElement = getByText('Payment successfull!')
		expect(textElement).toBeDefined()
	})
	it('renders the success screen for minting new tokens', () => {
		const { getByText } = render(
			<Success
				amount={21}
				hash='test-hash'
				mint='test-mint'
			/>
		)
		const textElement = getByText(`${formatInt(21)} Satoshi minted!`)
		expect(textElement).toBeDefined()
	})

	// it('has the global styles of a text component', () => {
	// 	const { getByText } = render(<Txt txt='Hello World!' />)
	// 	const textElement = getByText('Hello World!')
	// 	expect(textElement.props.style[0]).toStrictEqual({
	// 		fontSize: 16,
	// 		color: '#656565'
	// 	})
	// })
	// it('has an additional specific style applied', () => {
	// 	const { getByText } = render(
	// 		<Txt txt='Hello World!' styles={[{ marginTop: 10 }]} />
	// 	)
	// 	const textElement = getByText('Hello World!')
	// 	expect(textElement.props.style[1].marginTop).toBe(10)
	// })
})
