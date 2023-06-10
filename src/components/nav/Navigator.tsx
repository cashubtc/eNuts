import DetailsPage from '@comps/pages/History/Details'
import MintInfoPage from '@comps/pages/Mints/Info'
import type { DrawerParamList, RootStackParamList } from '@model/nav'
import AddressbookPage from '@pages/Addressbook'
import ContactPage from '@pages/Addressbook/Contact'
import Dashboard from '@pages/Dashboard'
import EncodedTokenPage from '@pages/EncodedToken'
import HistoryPage from '@pages/History'
import Lightning from '@pages/Lightning'
import PayInvoicePage from '@pages/Lightning/payInvoice'
import Mints from '@pages/Mints'
import IntermintSwap from '@pages/Mints/IntermintSwap'
import MintBackup from '@pages/Mints/MintBackup'
import MintManagement from '@pages/Mints/MintManagement'
import MintProofsPage from '@pages/Mints/Proofs'
import QRScanPage from '@pages/QRScan.tsx'
import SendTokenPage from '@pages/Send'
import Settings from '@pages/Settings'
import BackupPage from '@pages/Settings/Backup'
import DisplaySettings from '@pages/Settings/Display'
import SecuritySettings from '@pages/Settings/Security'
import SuccessPage from '@pages/Success'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'

import CustomDrawer from './CustomDrawer'

export function Root() {
	return <Navigator />
}

/**
 * Drawer Navigation
 */
const Drawer = createDrawerNavigator<DrawerParamList>()

export function DrawerNav() {
	return (
		<Drawer.Navigator
			drawerContent={props => <CustomDrawer {...props} />}
			screenOptions={{
				headerShown: false,
				drawerStyle: styles.drawerStyles,
				drawerType: 'front'
			}}
		>
			<Drawer.Screen
				name='root'
				component={Root}
			/>
			<Drawer.Screen name='Address book' component={AddressbookPage} />
			<Drawer.Screen name='Contact' component={ContactPage} />
			<Drawer.Screen name='Settings' component={Settings} />
			<Drawer.Screen name='Display settings' component={DisplaySettings} />
			<Drawer.Screen name='Security settings' component={SecuritySettings} />
			<Drawer.Screen name='BackupPage' component={BackupPage} />
		</Drawer.Navigator>
	)
}

/**
 * Stack Navigation
 */
const Stack = createNativeStackNavigator<RootStackParamList>()

function Navigator() {
	const { color } = useContext(ThemeContext)
	return (
		<View style={{
			position: 'absolute',
			height: '100%',
			width: '100%',
			backgroundColor: color.BACKGROUND,
		}}>
			<Stack.Navigator
				screenOptions={{
					headerShown: false,
					animation: 'fade',
					animationDuration: 100,
				}}
			>
				<Stack.Screen
					name='dashboard'
					component={Dashboard}
				/>
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
				<Stack.Screen
					name='success'
					component={SuccessPage}
				/>
				<Stack.Screen
					name='lightning'
					component={Lightning}
				/>
				<Stack.Screen
					name='pay invoice'
					component={PayInvoicePage}
					options={{
						animation: 'slide_from_bottom',
						animationDuration: 100,
					}}
				/>
				<Stack.Screen
					name='mints'
					component={Mints}
				/>
				<Stack.Screen
					name='mintmanagement'
					component={MintManagement}
				/>
				<Stack.Screen
					name='mint info'
					component={MintInfoPage}
				/>
				<Stack.Screen
					name='inter-mint swap'
					component={IntermintSwap}
				/>
				<Stack.Screen
					name='mint backup'
					component={MintBackup}
				/>
				<Stack.Screen
					name='mint proofs'
					component={MintProofsPage}
				/>
				<Stack.Screen
					name='qr scan'
					component={QRScanPage}
				/>
				<Stack.Screen
					name='history'
					component={HistoryPage}
				/>
				<Stack.Screen
					name='history entry details'
					component={DetailsPage}
				/>
			</Stack.Navigator>
		</View>
	)
}

const styles = StyleSheet.create({
	drawerStyles: {
		width: 260,
		backgroundColor: 'transparent'
	}
})