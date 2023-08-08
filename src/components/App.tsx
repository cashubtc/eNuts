import { getEncodedToken } from '@cashu/cashu-ts'
import usePrompt from '@comps/hooks/Prompt'
import { env } from '@consts'
import { FiveMins } from '@consts/time'
import { addAllMintIds, getBalance, getMintsBalances, getMintsUrls, initDb } from '@db'
import { fsInfo } from '@db/fs'
import { l } from '@log'
import type { ITokenInfo } from '@model'
import type { INavigatorProps } from '@model/nav'
import Navigator from '@nav/Navigator'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { KeyboardProvider } from '@src/context/Keyboard'
import { NostrProvider } from '@src/context/Nostr'
import { PinCtx } from '@src/context/Pin'
import { PrivacyContext } from '@src/context/Privacy'
import { PromptCtx } from '@src/context/Prompt'
import { ThemeProvider } from '@src/context/Theme'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { addToHistory } from '@store/HistoryStore'
import { formatInt, formatMintUrl, hasTrustedMint, isCashuToken, isErr, isNull, isStr, sleep } from '@util'
import { routingInstrumentation } from '@util/crashReporting'
import { claimToken, isTokenSpendable, runRequestTokenLoop } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import axios from 'axios'
import * as Clipboard from 'expo-clipboard'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from 'sentry-expo'

import ClipboardModal from './ClipboardModal'
import { CustomErrorBoundary } from './screens/ErrorScreen/ErrorBoundary'
import { ErrorDetails } from './screens/ErrorScreen/ErrorDetails'
import Toaster from './Toaster'
// import { dropAllData } from '@src/storage/dev'

interface ILockData {
	mismatch: boolean
	mismatchCount: number
	locked: boolean
	lockedCount: number
	lockedTime: number,
	timestamp: number
}

void SplashScreen.preventAutoHideAsync()

export default function App() {
	if (!env?.SENTRY_DSN) {
		return (
			<SafeAreaProvider>
				<CustomErrorBoundary catchErrors='always'>
					<_App />
				</CustomErrorBoundary>
			</SafeAreaProvider>
		)
	}
	// Create the error boundary...
	const ErrorBoundary = Sentry.Native.ErrorBoundary
	// Uses the Sentry error boundary component which posts the errors to our Sentry account
	return (
		<SafeAreaProvider>
			<ErrorBoundary fallback={ErrorDetails}>
				<_App />
			</ErrorBoundary>
		</SafeAreaProvider>
	)
}

function _App() {
	// initial auth state
	const [auth, setAuth] = useState<INavigatorProps>({
		shouldSetup: false,
		pinHash: ''
	})
	// app was longer than 5 mins in the background
	const [bgAuth, setBgAuth] = useState(false)
	// PIN mismatch state
	const [attempts, setAttempts] = useState({
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	})
	const handlePinForeground = async () => {
		// check if app is locked
		const now = Math.ceil(Date.now() / 1000)
		const lockData = await store.getObj<ILockData>(STORE_KEYS.lock)
		if (lockData) {
			// set state acccording to lockData timestamp
			const secsPassed = now - lockData.timestamp
			const lockedTime = lockData.lockedTime - secsPassed
			setAttempts({
				...lockData,
				mismatch: false,
				lockedTime
			})
		}
		// handle app was longer than 5 mins in the background
		const bgTimestamp = await store.get(STORE_KEYS.bgCounter)
		if (isStr(bgTimestamp) && bgTimestamp.length > 0) {
			if (now - +bgTimestamp > FiveMins) {
				setBgAuth(true)
			}
		}
	}
	const pinData = { attempts, setAttempts }
	const navigation = useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null)
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { t, i18n } = useTranslation(['common'])
	const [isRdy, setIsRdy] = useState(false)
	const [claimed, setClaimed] = useState(false)
	const claimData = useMemo(() => ({ claimed, setClaimed }), [claimed])
	// privacy context
	const [hidden, setHidden] = useState(false)
	const privacyData = useMemo(() => ({ hidden, setHidden }), [hidden])
	// prompt toaster
	const { prompt, openPrompt, closePrompt, openPromptAutoClose } = usePrompt()
	const promptData = useMemo(() => ({
		prompt,
		openPrompt,
		closePrompt,
		openPromptAutoClose
	}), [prompt, openPrompt, closePrompt, openPromptAutoClose])
	// app foregorund, background
	const appState = useRef(AppState.currentState)
	const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>()
	const [claimOpen, setClaimOpen] = useState(false)

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
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('checkSpendableErr', { ns: 'error' }) })
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

	// init
	useEffect(() => {
		async function initDB() {
			try {
				await initDb()
				runRequestTokenLoop()
				// await addAllMintIds()
				/* const test = await getProofs()
				l({ test }, await getBalance())
				l(await getBalancesByKeysetId()) */
			} catch (e) {
				l(isErr(e) ? e.message : '')
				alert(t('dbErr'))
			}
		}
		async function initAuth() {
			const [pinHash, shouldSetup] = await Promise.all([
				secureStore.get(SECURESTORE_KEY),
				store.get(STORE_KEYS.pinSkipped),
			])
			setAuth({
				pinHash: isNull(pinHash) ? '' : pinHash,
				shouldSetup: !isStr(shouldSetup) || !shouldSetup?.length
			})
			// check for pin attempts and app locked state
			await handlePinForeground()
		}
		async function init() {
			await initDB()
			const ten_seconds = 10_000
			const [timeout, lang, balances, balance] = await Promise.all([
				// preferred time in ms for request timeout
				store.get(STORE_KEYS.reqTimeout),
				// preferred language
				store.get(STORE_KEYS.lang),
				// balances
				getMintsBalances(),
				getBalance(),
				// PIN setup
				initAuth(),
			])
			axios.defaults.timeout = isStr(timeout) ? +timeout : ten_seconds
			if (lang?.length) {
				await i18n.changeLanguage(lang)
			}
			const mintBalsTotal = (balances).reduce((acc, cur) => acc + cur.amount, 0)
			if (mintBalsTotal !== balance) {
				try {
					await addAllMintIds()
				} catch (e) {
					openPromptAutoClose({ msg: isErr(e) ? e.message : t('addAllMintIdsErr', { ns: 'error' }) })
				}
			}
			// init privacy preferences
			const isHidden = await store.get(STORE_KEYS.hiddenBal)
			setHidden(!!isHidden)
			// await dropAllData()
			setIsRdy(true)
		}
		void init().then(fsInfo)
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const subscription = AppState.addEventListener('change', async nextAppState => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				l('App has come to the foreground!')
				setClaimed(false)
				// check for pin attempts and app locked state
				await handlePinForeground()
				// check for clipboard valid cashu token when the app comes to the foregorund
				await handleForeground()
			} else {
				l('App has gone to the background!')
				// store timestamp to activate auth after > 5mins in background
				await store.set(STORE_KEYS.bgCounter, `${Math.ceil(Date.now() / 1000)}`)
			}
			appState.current = nextAppState
		})
		return () => subscription.remove()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return null }

	// await SplashScreen.hideAsync() is done in the last context provider
	// to ensure all initial requests are done before displaying content
	return (
		<ThemeProvider>
			<NostrProvider>
				<PrivacyContext.Provider value={privacyData}>
					<NavigationContainer
						// theme={theme === 'Light' ? light : dark}
						ref={navigation}
						onReady={() => { routingInstrumentation?.registerNavigationContainer?.(navigation) }}
					>
						<PromptCtx.Provider value={promptData}>
							<PinCtx.Provider value={pinData}>
								<FocusClaimCtx.Provider value={claimData}>
									<KeyboardProvider>
										<Navigator
											shouldSetup={auth.shouldSetup}
											pinHash={auth.pinHash}
											bgAuth={bgAuth}
											setBgAuth={setBgAuth}
										/>
										<StatusBar style="auto" />
										{/* claim token if app comes to foreground and clipboard has valid cashu token */}
										{tokenInfo &&
											<ClipboardModal
												visible={claimOpen}
												tokenInfo={tokenInfo}
												closeModal={() => setClaimOpen(false)}
												handleRedeem={() => void handleRedeem()}
											/>
										}
										{/* Toaster prompt */}
										{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
									</KeyboardProvider>
								</FocusClaimCtx.Provider>
							</PinCtx.Provider>
						</PromptCtx.Provider>
					</NavigationContainer>
				</PrivacyContext.Provider>
			</NostrProvider>
		</ThemeProvider>
	)
}