import { render } from '@testing-library/react-native'
import Txt from '@comps/Txt'

describe('Basic test of the Txt.tsx component', () => {
	it('renders the expected string', () => {
		const { getByText } = render(<Txt txt='Hello World!' />)
		const textElement = getByText('Hello World!')
		expect(textElement).toBeDefined()
	})
	it('has the global styles of a text component', () => {
		const { getByText } = render(<Txt txt='Hello World!' />)
		const textElement = getByText('Hello World!')
		expect(textElement.props.style[0]).toStrictEqual({
			fontSize: 16,
			color: ''
		})
	})
	it('has an additional specific style applied', () => {
		const { getByText } = render(
			<Txt txt='Hello World!' styles={[{ marginTop: 10 }]} />
		)
		const textElement = getByText('Hello World!')
		expect(textElement.props.style[1].marginTop).toBe(10)
	})
})
