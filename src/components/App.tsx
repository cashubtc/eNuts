import usePrompt from '@comps/hooks/Prompt'
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
import { PrivacyContext } from '@src/context/Privacy'
import { PromptCtx } from '@src/context/Prompt'
import { ThemeProvider } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { isErr, isStr } from '@util'
import { routingInstrumentation } from '@util/crashReporting'
import { runRequestTokenLoop } from '@wallet'
import axios from 'axios'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
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
	// navigation reference
	const navigation = useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null)
	// i18next
	const { t, i18n } = useTranslation(['common'])
	// app ready to render content
	const [isRdy, setIsRdy] = useState(false)



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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return null }

	// await SplashScreen.hideAsync() is done in the last context provider
	// to ensure all initial requests are done before displaying content
	return (
		<ThemeProvider>
			<PinProvider>
				<FocusClaimProvider>
					<NostrProvider>
						<PrivacyContext.Provider value={privacyData}>
							<NavigationContainer
								// theme={theme === 'Light' ? light : dark}
								ref={navigation}
								onReady={() => { routingInstrumentation?.registerNavigationContainer?.(navigation) }}
							>
								<PromptCtx.Provider value={promptData}>
									<KeyboardProvider>
										<Navigator />
										<StatusBar style="auto" />
										{/* claim token if app comes to foreground and clipboard has valid cashu token */}
										<ClipboardModal />
										{/* Toaster prompt */}
										{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
									</KeyboardProvider>
								</PromptCtx.Provider>
							</NavigationContainer>
						</PrivacyContext.Provider>
					</NostrProvider>
				</FocusClaimProvider>
			</PinProvider>
		</ThemeProvider>
	)
}