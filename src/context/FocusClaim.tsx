import { isIOS } from '@consts'
import { getMintsUrls } from '@db'
import { l } from '@log'
import type { ITokenInfo } from '@model'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getDefaultMint } from '@store/mintStore'
import { getStrFromClipboard, hasTrustedMint, isCashuToken, isStr, sleep } from '@util'
import { isTokenSpendable } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

const useFocusClaim = () => {
	// back-foreground state reference
	const appState = useRef(AppState.currentState)
	const [claimed, setClaimed] = useState(false)
	// modal
	const [claimOpen, setClaimOpen] = useState(false)
	const closeModal = useCallback(() => setClaimOpen(false), [])
	const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>()

	const handleForeground = async () => {
		// TODO immediatly reading clipboard after the app comes to the foreground can result
		// in an empty string returned. Find a better way than the following function to handle it.
		let isSpent = false
		const fn = async () => {
			const selfCreated = await store.get(STORE_KEYS.createdToken)
			const clipboard = await getStrFromClipboard()
			const cleanedClipboard = isCashuToken(clipboard ?? '')
			if (!cleanedClipboard?.length) { return false }
			if (selfCreated === cleanedClipboard) { return false }
			const info = getTokenInfo(cleanedClipboard)
			if (!info) { return false }
			// check if mint is a trusted one
			const defaultM = await getDefaultMint()
			const userMints = await getMintsUrls()
			// do not claim from clipboard when app comes to the foreground if mint from token is not trusted
			if (!hasTrustedMint(userMints, info.mints)|| (isStr(defaultM) && !info.mints.includes(defaultM))) {
				return false
			}
			// check if token is spendable
			try {
				const isSpendable = await isTokenSpendable(cleanedClipboard)
				isSpent = !isSpendable
				if (!isSpendable) { return false }
			} catch {
				// openPromptAutoClose({ msg: isErr(e) ? e.message : t('checkSpendableErr') })
				return
			}
			setTokenInfo(info)
			setClaimOpen(true)
			return true
		}
		for (let i = 0; i < 10; i++) {
			 
			if (await fn() || isSpent) { return }
			 
			await sleep(50)
		}
	}

	useEffect(() => {
		// disable foreground claim on iOS
		if (isIOS) { return }
		const subscription = AppState.addEventListener('change', async nextAppState => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				l('[Claim token] App has come to the foreground!')
				setClaimed(false)
				// check for clipboard valid cashu token when the app comes to the foregorund
				await handleForeground()
			} else {
				l('[Claim token] App has gone to the background!')
			}
			appState.current = nextAppState
		})
		return () => subscription.remove()
		 
	}, [])

	return {
		claimed,
		setClaimed,
		claimOpen,
		setClaimOpen,
		closeModal,
		tokenInfo,
	}
}
type useFocusClaimType = ReturnType<typeof useFocusClaim>
/**
 * A state that indicates if a cashu token has been claimed from
 * clipboard after the app comes to the foreground.
 * It is used to re-render the total balance after claiming
 */
const FocusClaimCtx = createContext<useFocusClaimType>({
	claimed: false,
	setClaimed: () => l(''),
	claimOpen: false,
	setClaimOpen: () => l(''),
	closeModal: () => l(''),
	tokenInfo: undefined,
})

export const useFocusClaimContext = () => useContext(FocusClaimCtx)

export const FocusClaimProvider = ({ children }: { children: React.ReactNode }) => (
	<FocusClaimCtx.Provider value={useFocusClaim()} >
		{children}
	</FocusClaimCtx.Provider>
)