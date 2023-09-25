/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/await-thenable */
import { l } from '@log'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { createContext, useContext, useEffect, useState } from 'react'

const usePrivacy = () => {
	const [hidden, setHidden] = useState({
		balance: false,
		txs: false
	})

	const handleHiddenBalance = async () => {
		setHidden({ balance: !hidden.balance, txs: hidden.txs })
		if (hidden.balance) {
			await store.delete(STORE_KEYS.hiddenBal)
			return
		}
		await store.set(STORE_KEYS.hiddenBal, '1')
	}

	const handleHiddenTxs = async () => {
		setHidden({ balance: hidden.balance, txs: !hidden.txs })
		if (hidden.txs) {
			await store.delete(STORE_KEYS.hiddenTxs)
			return
		}
		await store.set(STORE_KEYS.hiddenTxs, '1')
	}

	const handleLogoPress = async () => {
		// both hidden, show both
		if (hidden.balance && hidden.txs) {
			setHidden({ balance: false, txs: false })
			await Promise.all([
				store.delete(STORE_KEYS.hiddenTxs),
				store.delete(STORE_KEYS.hiddenBal)
			])
			return
		}
		setHidden({ balance: true, txs: true })
		await Promise.all([
			store.set(STORE_KEYS.hiddenTxs, '1'),
			store.set(STORE_KEYS.hiddenBal, '1')
		])
	}

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
		setHidden,
		handleHiddenBalance,
		handleHiddenTxs,
		handleLogoPress
	}
}
type usePrivacyType = ReturnType<typeof usePrivacy>
const PrivacyContext = createContext<usePrivacyType>({
	hidden: { balance: false, txs: false },
	setHidden: () => l(''),
	handleHiddenBalance: async () => await l(''),
	handleHiddenTxs: async () => await l(''),
	handleLogoPress: async () => await l('')
})

export const usePrivacyContext = () => useContext(PrivacyContext)

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => (
	<PrivacyContext.Provider value={usePrivacy()} >
		{children}
	</PrivacyContext.Provider>
)
