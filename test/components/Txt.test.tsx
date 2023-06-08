import { render } from '@testing-library/react-native'
import Txt from '@comps/Txt'

describe('Basic test of the Txt.tsx component', () => {
	it('renders the expected string', () => {
		const { getByText } = render(<Txt txt='Hello World!' />)
		const textElement = getByText('Hello World!')
		expect(textElement).toBeDefined()
	})
})
