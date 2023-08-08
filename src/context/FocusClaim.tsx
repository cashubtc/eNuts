import { getEncodedToken } from '@cashu/cashu-ts'
import { getMintsUrls } from '@db'
import { l } from '@log'
import type { ITokenInfo } from '@model'
import { addToHistory } from '@store/HistoryStore'
import { formatInt, formatMintUrl, hasTrustedMint, isCashuToken, isErr, sleep } from '@util'
import { claimToken, isTokenSpendable } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import * as Clipboard from 'expo-clipboard'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState } from 'react-native'

import { PromptCtx } from './Prompt'

const useFocusClaim = () => {
	const { t } = useTranslation()
	const { openPromptAutoClose } = useContext(PromptCtx)
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
			const clipboard = await Clipboard.getStringAsync()
			if (!isCashuToken(clipboard)) { return false }
			const info = getTokenInfo(clipboard)
			if (!info) { return false }
			// check if mint is a trusted one
			const userMints = await getMintsUrls()
			// do not claim from clipboard when app comes to the foreground if mint from token is not trusted
			if (!hasTrustedMint(userMints, info.mints)) { return false }
			// check if token is spendable
			try {
				const isSpendable = await isTokenSpendable(clipboard)
				isSpent = !isSpendable
				if (!isSpendable) { return false }
			} catch (e) {
				// openPromptAutoClose({ msg: isErr(e) ? e.message : t('checkSpendableErr', { ns: 'error' }) })
				return
			}
			setTokenInfo(info)
			setClaimOpen(true)
			return true
		}
		for (let i = 0; i < 10; i++) {
			// eslint-disable-next-line no-await-in-loop
			if (await fn() || isSpent) { return }
			// eslint-disable-next-line no-await-in-loop
			await sleep(50)
		}
	}

	const handleRedeem = async () => {
		if (!tokenInfo) { return }
		setClaimOpen(false)
		const encoded = getEncodedToken(tokenInfo.decoded)
		try {
			const success = await claimToken(encoded).catch(l)
			if (!success) {
				openPromptAutoClose({ msg: t('invalidOrSpent') })
				return
			}
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('claimTokenErr', { ns: 'error' }) })
			return
		}
		const info = getTokenInfo(encoded)
		if (!info) {
			openPromptAutoClose({ msg: t('tokenInfoErr') })
			return
		}
		// add as history entry
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encoded,
			mints: info.mints,
		})
		openPromptAutoClose(
			{
				msg: t(
					'claimSuccess',
					{
						amount: formatInt(info.value),
						mintUrl: formatMintUrl(info.mints[0]),
						memo: info.decoded.memo
					}
				),
				success: true
			})
		setClaimed(true)
	}

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const subscription = AppState.addEventListener('change', async nextAppState => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				l('App has come to the foreground!')
				setClaimed(false)
				// check for clipboard valid cashu token when the app comes to the foregorund
				await handleForeground()
			} else {
				l('App has gone to the background!')
			}
			appState.current = nextAppState
		})
		return () => subscription.remove()
	}, [])
	return {
		claimed,
		setClaimed,
		claimOpen,
		closeModal,
		tokenInfo,
		handleRedeem
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
	closeModal: () => l(''),
	tokenInfo: undefined,
	// eslint-disable-next-line @typescript-eslint/await-thenable, no-return-await
	handleRedeem: async () => await l('')
})

export const useFocusClaimContext = () => useContext(FocusClaimCtx)

export const FocusClaimProvider = ({ children }: { children: React.ReactNode }) => (
	<FocusClaimCtx.Provider value={useFocusClaim()} >
		{children}
	</FocusClaimCtx.Provider>
)