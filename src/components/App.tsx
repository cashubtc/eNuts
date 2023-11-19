import { env } from '@consts'
import { FiveMins } from '@consts/time'
import { addAllMintIds, getBalance, getMintsBalances, initDb } from '@db'
import { fsInfo } from '@db/fs'
import { l } from '@log'
import type { INavigatorProps } from '@model/nav'
import Navigator from '@nav/Navigator'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { CustomErrorBoundary } from '@screens/ErrorScreen/ErrorBoundary'
import { ErrorDetails } from '@screens/ErrorScreen/ErrorDetails'
import { FocusClaimProvider } from '@src/context/FocusClaim'
import { KeyboardProvider } from '@src/context/Keyboard'
import { NostrProvider } from '@src/context/Nostr'
import { PinCtx } from '@src/context/Pin'
import { PrivacyProvider } from '@src/context/Privacy'
import { PromptProvider } from '@src/context/Prompt'
import { ThemeProvider, useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { dark, light } from '@styles'
import { isErr, isNull, isStr } from '@util'
import { routingInstrumentation } from '@util/crashReporting'
import { runRequestTokenLoop } from '@wallet'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, LogBox } from 'react-native'
import { MenuProvider } from 'react-native-popup-menu'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from 'sentry-expo'

import Blank from './Blank'
import ClipboardModal from './ClipboardModal'
import Toaster from './Toaster'

LogBox.ignoreLogs(['is deprecated'])
// LogBox.ignoreLogs([/expo-image/gmi])
interface ILockData {
	mismatch: boolean
	mismatchCount: number
	locked: boolean
	lockedCount: number
	lockedTime: number,
	timestamp: number
}

l('[APP] Starting app...')

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
	const [auth, setAuth] = useState<INavigatorProps>({ pinHash: '' })
	const [shouldOnboard, setShouldOnboard] = useState(false)
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
	const pinData = { attempts, setAttempts }
	// i18next
	const { t, i18n } = useTranslation([NS.common])
	// app ready to render content
	const [isRdy, setIsRdy] = useState(false)
	// app foregorund, background
	const appState = useRef(AppState.currentState)

	// init database
	const initDB = async () => {
		try {
			await initDb()
			runRequestTokenLoop()
		} catch (e) {
			l(isErr(e) ? e.message : 'Error while initiating the database.')
			alert(t('dbErr'))
		}
	}

	// init stored data
	const initData = async () => {
		try {
			const [lang, balances, balance] = await Promise.all([
				// preferred language
				store.get(STORE_KEYS.lang),
				// balances
				getMintsBalances(),
				getBalance(),
			])
			if (lang?.length) {
				await i18n.changeLanguage(lang)
			}
			const mintBalsTotal = (balances).reduce((acc, cur) => acc + cur.amount, 0)
			if (mintBalsTotal !== balance) { await addAllMintIds() }
		} catch (e) {
			l(isErr(e) ? e.message : 'Error while initiating the user app configuration.')
		} finally {
			await fsInfo()
		}
	}

	// init auth data
	const initAuth = async () => {
		const [pinHash, onboard] = await Promise.all([
			secureStore.get(SECURESTORE_KEY),
			store.get(STORE_KEYS.explainer)
		])
		setAuth({ pinHash: isNull(pinHash) ? '' : pinHash })
		setShouldOnboard(onboard && onboard === '1' ? false : true)
		// check for pin attempts and app locked state
		await handlePinForeground()
	}

	const handlePinForeground = async () => {
		// check if app has pw
		const pw = await secureStore.get(SECURESTORE_KEY)
		if (isNull(pw)) { return }
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

	// init
	useEffect(() => {
		async function init() {
			await initDB()
			await initAuth()
			await initData()
			setIsRdy(true) // APP is ready to render
		}
		void init()
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const subscription = AppState.addEventListener('change', async nextAppState => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				l('[PIN] App has come to the foreground!')
				// check for pin attempts and app locked state
				await handlePinForeground()
			} else {
				l('[PIN] App has gone to the background!')
				// store timestamp to activate auth after > 5mins in background
				await store.set(STORE_KEYS.bgCounter, `${Math.ceil(Date.now() / 1000)}`)
			}
			appState.current = nextAppState
		})
		return () => subscription.remove()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return <Blank /> }

	return (
		<ThemeProvider>
			<PinCtx.Provider value={pinData}>
				<MenuProvider>
					<PrivacyProvider>
						<NostrProvider>
							<NavContainer>
								<FocusClaimProvider >
									<PromptProvider>
										<KeyboardProvider>
											<Navigator
												shouldOnboard={shouldOnboard}
												pinHash={auth.pinHash}
												bgAuth={bgAuth}
												setBgAuth={setBgAuth}
											/>
											<StatusBar style="auto" />
											<ClipboardModal />
											<Toaster />
										</KeyboardProvider>
									</PromptProvider>
								</FocusClaimProvider>
							</NavContainer>
						</NostrProvider>
					</PrivacyProvider>
				</MenuProvider>
			</PinCtx.Provider>
		</ThemeProvider>
	)
}

function NavContainer({ children }: { children: React.ReactNode }) {
	const navigation = useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null)
	const { theme } = useThemeContext()

	return (
		<NavigationContainer
			theme={theme === 'Light' ? light : dark}
			ref={navigation}
			onReady={() => { routingInstrumentation?.registerNavigationContainer?.(navigation) }}
		>
			{children}
		</NavigationContainer>
	)
}