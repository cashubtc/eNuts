import AuthPage from '@comps/screens/Auth'
import AboutSettings from '@comps/screens/Settings/About'
import type { INavigatorProps, RootStackParamList } from '@model/nav'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AddressbookPage from '@screens/Addressbook'
import ContactPage from '@screens/Addressbook/Contact'
import Dashboard from '@screens/Dashboard'
import EncodedTokenPage from '@screens/EncodedToken'
import HistoryPage from '@screens/History'
import DetailsPage from '@screens/History/Details'
import Lightning from '@screens/Lightning'
import PayInvoicePage from '@screens/Lightning/payInvoice'
import Mints from '@screens/Mints'
import MintInfoPage from '@screens/Mints/Info'
import IntermintSwap from '@screens/Mints/IntermintSwap'
import MintBackup from '@screens/Mints/MintBackup'
import MintManagement from '@screens/Mints/MintManagement'
import MintProofsPage from '@screens/Mints/Proofs'
import QRScanPage from '@screens/QRScan'
import SendTokenPage from '@screens/Send'
import Settings from '@screens/Settings'
import BackupPage from '@screens/Settings/Backup'
import DisplaySettings from '@screens/Settings/Display'
import LanguageSettings from '@screens/Settings/Language'
import SecuritySettings from '@screens/Settings/Security'
import SuccessPage from '@screens/Success'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { View } from 'react-native'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Navigator({ shouldSetup, shouldAuth }: INavigatorProps) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={{
			position: 'absolute',
			height: '100%',
			width: '100%',
			backgroundColor: color.BACKGROUND,
		}}>
			<Stack.Navigator
				initialRouteName={shouldSetup || shouldAuth ? 'auth' : 'dashboard'}
				screenOptions={{
					headerShown: false,
					animation: 'fade',
					animationDuration: 100,
				}}
			>
				<Stack.Screen name='dashboard' component={Dashboard} />
				<Stack.Screen name='auth' component={AuthPage} initialParams={{ shouldAuth, shouldSetup }} />
				{/* create sendable token page */}
				<Stack.Screen
					name='send'
					component={SendTokenPage}
					options={{
						animation: 'slide_from_bottom',
						animationDuration: 100,
					}}
				/>
				{/* sendable token created page */}
				<Stack.Screen
					name='sendToken'
					component={EncodedTokenPage}
					options={{
						animation: 'slide_from_bottom',
						animationDuration: 100,
					}}
				/>
				<Stack.Screen name='success' component={SuccessPage} />
				<Stack.Screen name='lightning' component={Lightning} />
				<Stack.Screen
					name='pay invoice'
					component={PayInvoicePage}
					options={{
						animation: 'slide_from_bottom',
						animationDuration: 100,
					}}
				/>
				<Stack.Screen name='mints' component={Mints} />
				<Stack.Screen name='mintmanagement' component={MintManagement} />
				<Stack.Screen name='mint info' component={MintInfoPage} />
				<Stack.Screen name='inter-mint swap' component={IntermintSwap} />
				<Stack.Screen name='mint backup' component={MintBackup} />
				<Stack.Screen name='mint proofs' component={MintProofsPage} />
				<Stack.Screen name='qr scan' component={QRScanPage} />
				<Stack.Screen name='history' component={HistoryPage} />
				<Stack.Screen name='history entry details' component={DetailsPage} />
				<Stack.Screen name='Address book' component={AddressbookPage} />
				<Stack.Screen name='Contact' component={ContactPage} />
				<Stack.Screen name='Settings' component={Settings} />
				<Stack.Screen name='Display settings' component={DisplaySettings} />
				<Stack.Screen name='Security settings' component={SecuritySettings} />
				<Stack.Screen name='Language settings' component={LanguageSettings} />
				<Stack.Screen name='About settings' component={AboutSettings} />
				<Stack.Screen name='BackupPage' component={BackupPage} />
			</Stack.Navigator>
		</View>
	)
}
