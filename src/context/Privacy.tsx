import { l } from '@log'
import { createContext, useState } from 'react'

const usePrivacy = () => {
	const [hidden, setHidden] = useState(false)
	return {
		hidden,
		setHidden
	}
}
type usePrivacyType = ReturnType<typeof usePrivacy>
export const PrivacyContext = createContext<usePrivacyType>({
	hidden: false,
	setHidden: () => l('')
})