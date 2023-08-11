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
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from 'sentry-expo'

import ClipboardModal from './ClipboardModal'
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
	const pinData = { attempts, setAttempts }
	// i18next
	const { t, i18n } = useTranslation(['common'])
	// app ready to render content
	const [isRdy, setIsRdy] = useState(false)

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
				// DEPRECATED // TODO consider cashu-ts removing axios
				// preferred time in ms for request timeout
				// store.get(STORE_KEYS.reqTimeout),
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
			// await dropAllData() // DEV-ONLY DEBUG
			setIsRdy(true) // APP is ready to render
		} catch (e) {
			l(isErr(e) ? e.message : 'Error while initiating the user app configuration.')
		} finally {
			await fsInfo()
		}
	}

	// init pin auth data
	const initAuth = async () => {
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

	// init
	useEffect(() => {
		initDB().then(() => {
			// ignore
		}).catch(e => l(e))
		initData().then(() => {
			// ignore
		}).catch(e => l(e))
		initAuth().then(() => {
			// ignore
		}).catch(e => l(e))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return null }

	// await SplashScreen.hideAsync() is done in the last context provider
	// to ensure all initial requests are done before displaying content
	return (
		<ThemeProvider>
			<PinCtx.Provider value={pinData}>
				<FocusClaimProvider>
					<PrivacyProvider>
						<NostrProvider>
							<NavContainer>
								<PromptProvider>
									<KeyboardProvider>
										<Navigator
											shouldSetup={auth.shouldSetup}
											pinHash={auth.pinHash}
											bgAuth={bgAuth}
											setBgAuth={setBgAuth}
										/>
										<StatusBar style="auto" />
										<ClipboardModal />
										<Toaster />
									</KeyboardProvider>
								</PromptProvider>
							</NavContainer>
						</NostrProvider>
					</PrivacyProvider>
				</FocusClaimProvider>
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