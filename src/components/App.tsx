import { getEncodedToken } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { addAllMintIds, getBalance, getContacts, getMintsBalances, getMintsUrls, getPreferences, initDb, setPreferences } from '@db'
import { fsInfo } from '@db/fs'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { IInitialProps, IPreferences, ITokenInfo } from '@model'
import { DrawerNav } from '@nav/Navigator'
import { NavigationContainer } from '@react-navigation/native'
import { ContactsContext, IContact } from '@src/context/Contacts'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { KeyboardProvider } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { dark, globals, light } from '@styles'
import { formatInt, isCashuToken, isTrustedMint, sleep } from '@util'
import { claimToken, isTokenSpendable, runRequestTokenLoop } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import * as Clipboard from 'expo-clipboard'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'
import { AppState, Text, View } from 'react-native'

/* import * as DevMenu from 'expo-dev-menu'
import { StyleSheet } from 'react-native'


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonContainer: {
		backgroundColor: '#4630eb',
		borderRadius: 4,
		padding: 12,
		marginVertical: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 16,
	},
})

function Button({ label, onPress }: {
	onPress: (event: GestureResponderEvent) => void,
	label: string
}){
	return (
		<TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
			<Text style={styles.buttonText}>{label}</Text>
		</TouchableOpacity>
	)
} */
const defaultPref: IPreferences = {
	id: 1,
	darkmode: false,
	formatBalance: false,
	theme: 'Default'
}

void SplashScreen.preventAutoHideAsync()

export default function App(_initialProps: IInitialProps) {

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const [isRdy, setIsRdy] = useState(false)
	const [claimed, setClaimed] = useState(false)
	const claimData = { claimed, setClaimed }
	// theme related
	const [pref, setPref] = useState<IPreferences | undefined>()
	const [theme, setTheme] = useState('Light')
	const [color, setColors] = useState(theme === 'Light' ? light.custom : dark.custom)
	const [highlight, setHighlight] = useState('Default')
	const themeData = { pref, theme, setTheme, color, highlight, setHighlight }
	// address book
	const [contacts, setContacts] = useState<IContact[]>([])
	const hasOwnAddress = () => contacts.some(c => c.isOwner)
	const getPersonalInfo = () => contacts.find(c => c.isOwner)
	const contactData = { contacts, setContacts, hasOwnAddress, getPersonalInfo }
	// app foregorund, background
	const appState = useRef(AppState.currentState)
	const [, setAppStateVisible] = useState(appState.current)
	const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>()
	const [claimOpen, setClaimOpen] = useState(false)
	const { prompt, openPrompt, closePrompt } = usePrompt()
	const { loading, startLoading, stopLoading } = useLoading()

	const handleForeground = async () => {
		// TODO immediatly reading clipboard after the app comes to the foreground can result
		// in an empty string returned. Find a better way than the following function to handle it.
		let count = 0
		let isSpent = false
		const fn = async () => {
			count++
			const clipboard = await Clipboard.getStringAsync()
			l({ clipboard, count })
			if (!isCashuToken(clipboard)) { return false }
			const info = getTokenInfo(clipboard)
			// check if mint is a trusted one
			const userMints = await getMintsUrls()
			// do not claim from clipboard when app comes to the foreground if mint from token is not trusted
			// TODO token can belong to multiple mints
			if (!isTrustedMint(userMints, info?.mints || [])) { return false }
			// check if token is spendable
			const isSpendable = await isTokenSpendable(clipboard)
			isSpent = !isSpendable
			if (!info || !isSpendable) { return false }
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
		startLoading()
		if (!tokenInfo) { return }
		const encoded = getEncodedToken(tokenInfo.decoded)
		const success = await claimToken(encoded).catch(l)
		if (!success) {
			alert('Token invalid or already claimed')
			setClaimOpen(false)
			return
		}
		const info = getTokenInfo(encoded)
		if (!info) {
			l('Error while getting token info')
			return
		}
		// add as history entry
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encoded,
			mints: info.mints,
		})
		openPrompt(`Successfully claimed ${formatInt(info.value)} Satoshi!`)
		setClaimed(true)
		stopLoading()
		setClaimOpen(false)
	}

	// update theme
	useEffect(() => {
		setColors(theme === 'Light' ? light.custom : dark.custom)
		if (!pref) { return }
		// update state
		setPref({ ...pref, darkmode: theme === 'Dark' })
		// update DB
		void setPreferences({ ...pref, darkmode: theme === 'Dark' })
	}, [theme])
	// update highlighting color
	useEffect(() => {
		if (!pref) { return }
		// update state
		setPref({ ...pref, theme: highlight })
		// update DB
		void setPreferences({ ...pref, theme: highlight })
	}, [highlight])

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
				l(e)
				alert(`Something went wrong while initializing the DB! ${e instanceof Error ? e.message : ''}`)
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
				setPref(defaultPref)
			} finally {
				await SplashScreen.hideAsync()
				setIsRdy(true)
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
		async function init() {
			await initDB()
			await initContacts()
			await initPreferences()
			const mintBalsTotal = (await getMintsBalances()).reduce((acc, cur) => acc + cur.amount, 0)
			const bal = await getBalance()
			l({ bal, mintBalsTotal })
			if (mintBalsTotal !== bal) {
				await addAllMintIds()
			}
		}
		void init().then(fsInfo)
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const subscription = AppState.addEventListener('change', async nextAppState => {
			setClaimed(false)
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				l('App has come to the foreground!')
				// check for clipboard valid cashu token when the app comes to the foregorund
				await handleForeground()
			}
			appState.current = nextAppState
			setAppStateVisible(appState.current)
			l('AppState', appState.current)
		})
		return () => subscription.remove()
	}, [])

	if (!isRdy) { return null }

	return (
		<ThemeContext.Provider value={themeData}>
			<FocusClaimCtx.Provider value={claimData}>
				<ContactsContext.Provider value={contactData}>
					<KeyboardProvider>
						<NavigationContainer theme={theme === 'Light' ? light : dark}>
							<DrawerNav />
							<StatusBar style="auto" />
							{/* claim token if app comes to foreground and clipboard has valid cashu token */}
							{claimOpen &&
								<MyModal type='question' visible>
									<Text style={globals(color, highlight).modalHeader}>
										Found a cashu token in your clipboard
									</Text>
									<Text style={globals(color, highlight).modalTxt}>
										Memo: {tokenInfo?.decoded.memo}{'\n'}
										<Text style={{ fontWeight: '500' }}>
											{formatInt(tokenInfo?.value || 0)}
										</Text>
										{' '}Satoshi from the following mint:{' '}
										{tokenInfo?.mints.join(', ')}
									</Text>
									<Button
										txt={loading ? 'Claiming...' : 'Claim now!'}
										onPress={() => void handleRedeem()}
									/>
									<View style={{ marginVertical: 10 }} />
									<Button
										txt='Cancel'
										outlined
										onPress={() => setClaimOpen(false)}
									/>
								</MyModal>
							}
							<PromptModal
								hideIcon
								header={prompt.msg}
								visible={prompt.open}
								close={closePrompt}
							/>
							{/* {env.NODE_ENV === 'development' &&
							<View style={{ height: 100 }} >
								<Text>Current state is: {appStateVisible}</Text>
								<Text>
									{initialProps.mode} {
										process?.env
											? Object.entries(process.env)
												.map(e => e.join('='))
												.join('\n')
											: 'no env'
									}
								</Text>
								<Text>
									env obj
									{
										env
											? Object.entries(env)
												.map(e => e.join('='))
												.join('\n')
											: 'no env2'
									}</Text>
							</View>} */}

							{/* <Button
							label="Open Dev Menu"
							onPress={() => {
								DevMenu.openMenu()
							}}
						/> */}

						</NavigationContainer>
					</KeyboardProvider>
				</ContactsContext.Provider>
			</FocusClaimCtx.Provider>
		</ThemeContext.Provider>
	)
}
