import type { INavigatorProps, RootStackParamList } from '@model/nav'
import { useNavigation } from '@react-navigation/core'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import AddressbookPage from '@screens/Addressbook'
import ContactPage from '@screens/Addressbook/Contact'
import AuthPage from '@screens/Auth'
import Dashboard from '@screens/Dashboard'
import { Disclaimer } from '@screens/Disclaimer'
import HistoryPage from '@screens/History'
import DetailsPage from '@screens/History/Details'
import Mints from '@screens/Mints'
import MintInfoPage from '@screens/Mints/Info'
import MintBackup from '@screens/Mints/MintBackup'
import MintManagement from '@screens/Mints/MintManagement'
import MintProofsPage from '@screens/Mints/Proofs'
import NostrOnboardingScreen from '@screens/NostrOnboarding'
import OnboardingScreen from '@screens/Onboarding'
import ProcessingScreen from '@screens/Payment/Processing'
import ProcessingErrorScreen from '@screens/Payment/ProcessingError'
import InvoiceScreen from '@screens/Payment/Receive/Invoice'
import NostrDMScreen from '@screens/Payment/Receive/nostrDM'
import SelectAmountScreen from '@screens/Payment/SelectAmount'
import SelectMintScreen from '@screens/Payment/SelectMint'
import CoinSelectionScreen from '@screens/Payment/Send/CoinSelection'
import EncodedTokenPage from '@screens/Payment/Send/EncodedToken'
import InputfieldScreen from '@screens/Payment/Send/Inputfield'
import MemoScreen from '@screens/Payment/Send/MemoScreen'
import SelectMintToSwapToScreen from '@screens/Payment/Send/SelectMintToSwapTo'
import SelectTargetScreen from '@screens/Payment/Send/SelectTarget'
import SuccessPage from '@screens/Payment/Success'
import QRScanPage from '@screens/QRScan'
import Settings from '@screens/Settings'
import AboutSettings from '@screens/Settings/About'
import BackupPage from '@screens/Settings/Backup'
import GeneralSettings from '@screens/Settings/General'
import AdvancedFunctionScreen from '@screens/Settings/General/Advanced'
import DisplaySettings from '@screens/Settings/General/Display'
import LanguageSettings from '@screens/Settings/General/Language'
import PrivacySettings from '@screens/Settings/Privacy'
import SecuritySettings from '@screens/Settings/Security'
import { useThemeContext } from '@src/context/Theme'
import { useEffect } from 'react'
import { View } from 'react-native'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Navigator({ shouldSetup, pinHash, bgAuth, setBgAuth }: INavigatorProps) {
	// const { auth, bgAuth, setBgAuth } = usePinContext()
	const { color } = useThemeContext()
	const nav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>>()
	useEffect(() => {
		if (!bgAuth || !pinHash.length) { return }
		setBgAuth?.(false)
		nav.navigate('auth', { pinHash })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bgAuth])
	return (
		<View style={{
			position: 'absolute',
			height: '100%',
			width: '100%',
			backgroundColor: color.BACKGROUND,
		}}>
			<Stack.Navigator
				initialRouteName={shouldSetup || pinHash || bgAuth ? 'auth' : 'dashboard'}
				screenOptions={{
					headerShown: false,
					animation: 'fade',
					animationDuration: 100,
				}}
			>
				<Stack.Screen name='selectMint' component={SelectMintScreen} />
				<Stack.Screen name='selectTarget' component={SelectTargetScreen} />
				<Stack.Screen name='selectMintToSwapTo' component={SelectMintToSwapToScreen} />
				<Stack.Screen name='meltInputfield' component={InputfieldScreen} />
				<Stack.Screen name='selectAmount' component={SelectAmountScreen} />
				<Stack.Screen name='memoScreen' component={MemoScreen} />
				<Stack.Screen name='coinSelection' component={CoinSelectionScreen} />
				<Stack.Screen name='nostrReceive' component={NostrDMScreen} />
				<Stack.Screen name='processing' component={ProcessingScreen} />
				<Stack.Screen name='processingError' component={ProcessingErrorScreen} />
				<Stack.Screen name='mintInvoice' component={InvoiceScreen} />
				<Stack.Screen
					name='onboarding'
					component={OnboardingScreen}
					options={{
						animation: 'simple_push',
						animationDuration: 250,
					}}
				/>
				<Stack.Screen name='nostr onboarding' component={NostrOnboardingScreen} />
				<Stack.Screen
					name='dashboard'
					component={Dashboard}
					options={{
						animation: 'simple_push',
						animationDuration: 250,
					}}
				/>
				<Stack.Screen name='disclaimer' component={Disclaimer} />
				<Stack.Screen
					name='auth'
					component={AuthPage}
					initialParams={{ pinHash }}
				/>
				{/* sendable token created page */}
				<Stack.Screen
					name='encodedToken'
					component={EncodedTokenPage}
					options={{
						animation: 'slide_from_bottom',
						animationDuration: 250,
					}}
				/>
				<Stack.Screen name='success' component={SuccessPage} />
				<Stack.Screen name='mints' component={Mints} />
				<Stack.Screen name='mintmanagement' component={MintManagement} />
				<Stack.Screen name='mint info' component={MintInfoPage} />
				<Stack.Screen name='mint backup' component={MintBackup} />
				<Stack.Screen name='mint proofs' component={MintProofsPage} />
				<Stack.Screen name='qr scan' component={QRScanPage} />
				<Stack.Screen name='history' component={HistoryPage} />
				<Stack.Screen name='history entry details' component={DetailsPage} />
				<Stack.Screen name='Address book' component={AddressbookPage} />
				<Stack.Screen name='Contact' component={ContactPage} />
				<Stack.Screen name='Settings' component={Settings} />
				<Stack.Screen name='General settings' component={GeneralSettings} />
				<Stack.Screen name='Display settings' component={DisplaySettings} />
				<Stack.Screen name='Security settings' component={SecuritySettings} />
				<Stack.Screen name='Privacy settings' component={PrivacySettings} />
				<Stack.Screen name='Language settings' component={LanguageSettings} />
				<Stack.Screen name='Advanced settings' component={AdvancedFunctionScreen} />
				<Stack.Screen name='About settings' component={AboutSettings} />
				<Stack.Screen name='BackupPage' component={BackupPage} />
			</Stack.Navigator>
		</View>
	)
}
