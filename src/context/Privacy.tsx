import { l } from '@log'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { createContext, useContext, useEffect, useState } from 'react'

const usePrivacy = () => {
	const [hidden, setHidden] = useState(false)
	useEffect(() => {
		void (async () => {
			// init privacy preferences
			const isHidden = await store.get(STORE_KEYS.hiddenBal)
			setHidden(!!isHidden)
		})()
	}, [])
	return {
		hidden,
		setHidden
	}
}
type usePrivacyType = ReturnType<typeof usePrivacy>
const PrivacyContext = createContext<usePrivacyType>({
	hidden: false,
	setHidden: () => l('')
})

export const usePrivacyContext = () => useContext(PrivacyContext)

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => (
	<PrivacyContext.Provider value={usePrivacy()} >
		{children}
	</PrivacyContext.Provider>
)
