import Success from '@comps/Success'
import { render, screen } from '@testing-library/react-native'
// {
// 	amount: number
// 	fee?: number
// 	mints?: string[]
// 	mint?: string
// 	memo?: string
// 	nav?: NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>
// 	hash?: string
// }
describe('Basic test of the Success.tsx component', () => {
	it('renders the success screen for payment from the mint to a LN wallet', () => {
		render(
			<Success
				amount={21}
				fee={0}
				mints={['test-mint']}
			/>
		)
		const textElement = screen.getByText('Payment successfull!')
		expect(textElement).toBeDefined()
	})
	it('renders the success screen for minting new tokens', () => {
		render(
			<Success
				amount={21}
				hash='test-hash'
				mint='test-mint'
			/>
		)
		const textElement = screen.getByText('21 Satoshi minted!')
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
