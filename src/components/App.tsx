import { env } from '@consts'
import { addAllMintIds, getBalance, getMintsBalances, initDb } from '@db'
import { fsInfo } from '@db/fs'
import { l } from '@log'
import Navigator from '@nav/Navigator'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { FocusClaimProvider } from '@src/context/FocusClaim'
import { KeyboardProvider } from '@src/context/Keyboard'
import { NostrProvider } from '@src/context/Nostr'
import { PinProvider } from '@src/context/Pin'
import { PrivacyProvider } from '@src/context/Privacy'
import { PromptProvider } from '@src/context/Prompt'
import { ThemeProvider, useThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { dark, light } from '@styles'
import { isErr } from '@util'
import { routingInstrumentation } from '@util/crashReporting'
import { runRequestTokenLoop } from '@wallet'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from 'sentry-expo'

import ClipboardModal from './ClipboardModal'
import { CustomErrorBoundary } from './screens/ErrorScreen/ErrorBoundary'
import { ErrorDetails } from './screens/ErrorScreen/ErrorDetails'
import Toaster from './Toaster'
// import { dropAllData } from '@src/storage/dev'

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

	// init
	useEffect(() => {
		void (async () => {
			// init database
			await initDB()
			// init stored data
			await initData()
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return null }

	// await SplashScreen.hideAsync() is done in the last context provider
	// to ensure all initial requests are done before displaying content
	return (
		<ThemeProvider>
			<PinProvider>
				<FocusClaimProvider>
					<PrivacyProvider>
						<NostrProvider>
							<NavContainer>
								<PromptProvider>
									<KeyboardProvider>
										<Navigator />
										<StatusBar style="auto" />
										<ClipboardModal />
										<Toaster />
									</KeyboardProvider>
								</PromptProvider>
							</NavContainer>
						</NostrProvider>
					</PrivacyProvider>
				</FocusClaimProvider>
			</PinProvider>
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