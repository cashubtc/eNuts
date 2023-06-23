/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CoinSelectionModal } from '@screens/Lightning/modal'
import { l } from '@src/logger'
import { render, screen } from '@testing-library/react-native'

describe('Basic styling test of the CoinSelectionModal component', () => {
	it('has a specific style applied', () => {
		render(
			<CoinSelectionModal
				lnAmount={1}
				disableCS={() => l('test coin selection modal')}
				proofs={[]}
				setProof={() => l('proofs')}
			/>
		)
		const modal = screen.getByTestId('testCoinSelectionModal')
		expect(modal.props.children.props.children.props.style[0].paddingHorizontal).toBe(0)
	})
})
