/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Txt from '@comps/Txt'
import { render, screen } from '@testing-library/react-native'
import { vs } from 'react-native-size-matters'

describe('Basic test of the Txt.tsx component', () => {
	it('renders the expected string', () => {
		render(<Txt txt='Hello World!' />)
		const textElement = screen.getByText('Hello World!')
		expect(textElement).toBeDefined()
	})
	it('has the global styles of a text component', () => {
		render(<Txt txt='Hello World!' />)
		const textElement = screen.getByText('Hello World!')
		expect(textElement.props.style[0]).toStrictEqual({
			fontSize: vs(14),
			color: '#656565'
		})
	})
	it('has an additional specific style applied', () => {
		render(
			<Txt txt='Hello World!' styles={[{ marginTop: 10 }]} />
		)
		const textElement = screen.getByText('Hello World!')
		expect(textElement.props.style[2].marginTop).toBe(10)
	})
})
