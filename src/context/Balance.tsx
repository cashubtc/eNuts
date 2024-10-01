/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable require-await */
import { getBalance } from '@db'
import { l } from '@log'
import { createContext, useContext, useEffect, useState } from 'react'

import { useFocusClaimContext } from './FocusClaim'

// Total Balance state (all mints)
const useBalance = () => {
	const [balance, setBalance] = useState(0)
	const { claimed } = useFocusClaimContext()

	const updateBalance = async () => {
		const bal = await getBalance()
		setBalance(bal)
	}

	useEffect(() => {
		void updateBalance()
	}, [])

	useEffect(() => {
		void updateBalance()
	}, [claimed])

	return {
		balance,
		updateBalance
	}
}
type useBalanceType = ReturnType<typeof useBalance>

const BalanceCtx = createContext<useBalanceType>({
	balance: 0,
	updateBalance: async () => l(''),
})

export const useBalanceContext = () => useContext(BalanceCtx)

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => (
	<BalanceCtx.Provider value={useBalance()} >
		{children}
	</BalanceCtx.Provider>
)