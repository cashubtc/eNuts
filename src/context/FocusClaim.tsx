import { l } from '@log'
import { createContext, useState } from 'react'

const useFocusClaim = () => {
	const [claimed, setClaimed] = useState(false)
	return {
		claimed,
		setClaimed
	}
}
type useFocusClaimType = ReturnType<typeof useFocusClaim>
/**
 * A state that indicates if a cashu token has been claimed from
 * clipboard after the app comes to the foreground.
 * It is used to re-render the total balance after claiming
 */
export const FocusClaimCtx = createContext<useFocusClaimType>({
	claimed: false,
	setClaimed: () => l('')
})