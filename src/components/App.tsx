import Bugsnag from '@bugsnag/expo'
import { getEncodedToken } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { env } from '@consts'
import { addAllMintIds, getBalance, getContacts, getMintsBalances, getMintsUrls, getPreferences, initDb, setPreferences } from '@db'
import { fsInfo } from '@db/fs'
import { l } from '@log'
import MyModal from '@modal'
import type { IInitialProps, IPreferences, ITokenInfo } from '@model'
import Navigator from '@nav/Navigator'
import { NavigationContainer } from '@react-navigation/native'
import { ContactsContext, type IContact } from '@src/context/Contacts'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { KeyboardProvider } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { addToHistory } from '@store/HistoryStore'
import { dark, globals, light } from '@styles'
import { formatInt, formatMintUrl, hasTrustedMint, isCashuToken, isErr, isStr, sleep } from '@util'
import { initCrashReporting } from '@util/crashReporting'
import { claimToken, isTokenSpendable, runRequestTokenLoop } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import * as Clipboard from 'expo-clipboard'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, Text, View } from 'react-native'

import { CustomErrorBoundary } from './ErrorScreen/ErrorBoundary'
import { ErrorDetails } from './ErrorScreen/ErrorDetails'
import Toaster from './Toaster'
import Txt from './Txt'

initCrashReporting()

void SplashScreen.preventAutoHideAsync()

// Bugsnag Error boundary. docs: https://docs.bugsnag.com/platforms/javascript/react/
export default function App(initialProps: IInitialProps) {
	if (env.BUGSNAG_API_KEY) {
		// Create the error boundary...
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)
		// Uses the bugsnack error boundary component which posts the errors to our bugsnag account
		return (
			<ErrorBoundary FallbackComponent={ErrorDetails}>
				<_App _initialProps={initialProps} exp={initialProps.exp} />
			</ErrorBoundary>
		)
	}
	return (
		<CustomErrorBoundary catchErrors='always'>
			<_App _initialProps={initialProps} exp={initialProps.exp} />
		</CustomErrorBoundary>
	)
}

function _App(_initialProps: IInitialProps) {
	// TODO check if user has a PIN
	const [auth, setAuth] = useState({
		shouldSetup: false,
		shouldAuth: false
	})
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { t, i18n } = useTranslation()
	const [isRdy, setIsRdy] = useState(false)
	const [claimed, setClaimed] = useState(false)
	const claimData = useMemo(() => ({ claimed, setClaimed }), [claimed])
	// theme related
	const [pref, setPref] = useState<IPreferences | undefined>()
	const [theme, setTheme] = useState('Light')
	const [color, setColors] = useState(theme === 'Light' ? light.custom : dark.custom)
	const [highlight, setHighlight] = useState('Default')
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const themeData = useMemo(() => ({ pref, theme, setTheme, color, highlight, setHighlight }), [pref])
	// address book
	const [contacts, setContacts] = useState<IContact[]>([])
	const hasOwnAddress = () => contacts.some(c => c.isOwner)
	const getPersonalInfo = () => contacts.find(c => c.isOwner)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const contactData = useMemo(() => ({ contacts, setContacts, hasOwnAddress, getPersonalInfo }), [contacts])
	// app foregorund, background
	const appState = useRef(AppState.currentState)
	const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>()
	const [claimOpen, setClaimOpen] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()

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
			const isSpendable = await isTokenSpendable(clipboard)
			isSpent = !isSpendable
			if (!isSpendable) { return false }
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
		const success = await claimToken(encoded).catch(l)
		if (!success) {
			openPromptAutoClose({ msg: t('common.invalidOrSpent') })
			return
		}
		const info = getTokenInfo(encoded)
		if (!info) {
			openPromptAutoClose({ msg: t('common.tokenInfoErr') })
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
					'common.claimSuccess',
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

	// update theme
	useEffect(() => {
		setColors(theme === 'Light' ? light.custom : dark.custom)
		if (!pref) { return }
		// update state
		setPref({ ...pref, darkmode: theme === 'Dark' })
		// update DB
		void setPreferences({ ...pref, darkmode: theme === 'Dark' })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [theme])
	// update highlighting color
	useEffect(() => {
		if (!pref) { return }
		// update state
		setPref({ ...pref, theme: highlight })
		// update DB
		void setPreferences({ ...pref, theme: highlight })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [highlight])
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
				alert(t('common.dbErr'))
			}
		}
		async function initPreferences() {
			try {
				// Initialize theme preferences
				const prefsDB = await getPreferences()
				setPref(prefsDB)
				setTheme(prefsDB?.darkmode ? 'Dark' : 'Light')
				setHighlight(prefsDB?.theme || 'Default')
			} catch (e) {
				l(e)
				setPref({
					id: 1,
					darkmode: false,
					formatBalance: false,
					theme: 'Default'
				})
			} finally {
				await SplashScreen.hideAsync()
			}
		}
		async function initContacts() {
			try {
				const contactsDB = await getContacts()
				setContacts(contactsDB)
			} catch (e) {
				l('Error while initializing contacts from DB')
			}
		}
		async function initAuth() {
			const skipped = await store.get('pinSkipped')
			setAuth(prev => ({ ...prev, shouldSetup: !isStr(skipped) || !skipped.length }))
		}
		async function init() {
			await initDB()
			await initContacts()
			await initPreferences()
			const storedLng = await store.get('settings:lang')
			if (storedLng?.length) {
				await i18n.changeLanguage(storedLng)
			}
			await initAuth()
			// await dropTable('proofs')
			// await dropTable('proofsUsed')
			// await dropTable('keysetIds')
			// await dropTable('mintKeys')
			// await dropTable('invoices')
			// await dropTable('preferences')
			// await dropTable('contacts')
			const mintBalsTotal = (await getMintsBalances()).reduce((acc, cur) => acc + cur.amount, 0)
			const bal = await getBalance()
			l({ bal, mintBalsTotal })
			if (mintBalsTotal !== bal) {
				await addAllMintIds()
			}
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
				// check for clipboard valid cashu token when the app comes to the foregorund
				await handleForeground()
			}
			appState.current = nextAppState
		})
		return () => subscription.remove()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!isRdy) { return null }

	return (
		<ThemeContext.Provider value={themeData}>
			<NavigationContainer theme={theme === 'Light' ? light : dark}>
				<FocusClaimCtx.Provider value={claimData}>
					<ContactsContext.Provider value={contactData}>
						<KeyboardProvider>
							<Navigator shouldSetup={true} shouldAuth={false} />
							<StatusBar style="auto" />
							{/* claim token if app comes to foreground and clipboard has valid cashu token */}
							<MyModal type='question' visible={claimOpen} close={() => setClaimOpen(false)}>
								<Text style={globals(color, highlight).modalHeader}>
									{t('common.foundCashuClipboard')}
								</Text>
								<Text style={globals(color, highlight).modalTxt}>
									{t('history.memo')}: {tokenInfo?.decoded.memo}{'\n'}
									<Txt
										txt={formatInt(tokenInfo?.value ?? 0)}
										styles={[{ fontWeight: '500' }]}
									/>
									{' '}Satoshi {t('common.fromMint')}:{' '}
									{tokenInfo?.mints.join(', ')}
								</Text>
								<Button
									txt={t('common.accept')}
									onPress={() => void handleRedeem()}
								/>
								<View style={{ marginVertical: 10 }} />
								<Button
									txt={t('common.cancel')}
									outlined
									onPress={() => setClaimOpen(false)}
								/>
							</MyModal>
							{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
						</KeyboardProvider>
					</ContactsContext.Provider>
				</FocusClaimCtx.Provider>
			</NavigationContainer>
		</ThemeContext.Provider>
	)
}