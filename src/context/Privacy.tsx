import { l } from '@log'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { createContext, useContext, useEffect, useState } from 'react'

const usePrivacy = () => {
	const [hidden, setHidden] = useState({
		balance: false,
		txs: false
	})
	useEffect(() => {
		void (async () => {
			// init privacy preferences
			const [isHiddenBal, isHiddenTxs] = await Promise.all([
				store.get(STORE_KEYS.hiddenBal),
				store.get(STORE_KEYS.hiddenTxs)
			])
			setHidden({
				balance: !!isHiddenBal,
				txs: !!isHiddenTxs
			})
		})()
	}, [])
	return {
		hidden,
		setHidden
	}
}
type usePrivacyType = ReturnType<typeof usePrivacy>
const PrivacyContext = createContext<usePrivacyType>({
	hidden: { balance: false, txs: false },
	setHidden: () => l('')
})

export const usePrivacyContext = () => useContext(PrivacyContext)

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => (
	<PrivacyContext.Provider value={usePrivacy()} >
		{children}
	</PrivacyContext.Provider>
)
