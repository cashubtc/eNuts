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
	it('hides the confirm button if not enough proofs are selected', () => {
		render(
			<CoinSelectionModal
				lnAmount={10}
				disableCS={() => l('test coin selection modal')}
				proofs={[
					{ selected: false, amount: 4, secret: '', C: '', id: '0' },
					{ selected: false, amount: 8, secret: '', C: '', id: '1' },
				]}
				setProof={() => l('proofs')}
			/>
		)
		expect(screen.queryByText('Confirm')).toBeNull()
	})
	it('should display the confirm button if enough proofs are selected', () => {
		render(
			<CoinSelectionModal
				lnAmount={10}
				disableCS={() => l('test coin selection modal')}
				proofs={[
					{ selected: true, amount: 4, secret: '', C: '', id: '0' },
					{ selected: true, amount: 8, secret: '', C: '', id: '1' },
				]}
				setProof={() => l('proofs')}
			/>
		)
		expect(screen.getByText('Confirm')).toBeDefined()
	})
	it('should display the change after selecting more proofs than needed', () => {
		render(
			<CoinSelectionModal
				lnAmount={10}
				disableCS={() => l('test coin selection modal')}
				proofs={[
					{ selected: true, amount: 4, secret: '', C: '', id: '0' },
					{ selected: true, amount: 8, secret: '', C: '', id: '1' },
				]}
				setProof={() => l('proofs')}
			/>
		)
		expect(screen.getByText('Change')).toBeDefined()
		expect(screen.getByText('2 Sat')).toBeDefined()
	})
	it('should not display the change after selecting the exact proofs needed', () => {
		render(
			<CoinSelectionModal
				lnAmount={10}
				disableCS={() => l('test coin selection modal')}
				proofs={[
					{ selected: true, amount: 4, secret: '', C: '', id: '0' },
					{ selected: true, amount: 4, secret: '', C: '', id: '1' },
					{ selected: true, amount: 2, secret: '', C: '', id: '2' },
				]}
				setProof={() => l('proofs')}
			/>
		)
		expect(screen.queryByText('Change')).toBeNull()
	})
})
