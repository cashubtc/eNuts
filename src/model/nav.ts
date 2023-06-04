import { DrawerScreenProps } from '@react-navigation/drawer'
import { Theme } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { IContact } from '@src/context/Contacts'

import type { IHistoryEntry, IMintUrl } from '.'

/**
 * Stack Navigator
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamList = {
	dashboard: undefined
	send: undefined
	sendToken: {
		token: string
		amount: string
	}
	success: {
		amount?: number
		fee?: number
		mints?: string[]
	}
	lightning: {
		mint?: string
		balance?: number
		receive?: boolean
		send?: boolean
	} | undefined
	'pay invoice': {
		mint_url: string
		mintBal: number
	}
	mints: undefined
	mintmanagement: {
		mint_url: string
		amount: number
		// mint_key: string
	}
	'mint info': {
		mint_url: string
	}
	'inter-mint swap': {
		mint_url: string
		mints: IMintUrl[]
		balance: number
	}
	'mint backup': {
		token: string
		mint_url: string
	}
	'qr scan': undefined
	'history': undefined
	'history entry details': {
		entry: IHistoryEntry
	}
}
export type TRouteString = 'dashboard' | 'lightning' | 'mints' | 'history'
export type TDashboardPageProps = NativeStackScreenProps<RootStackParamList, 'dashboard', 'MyStack'>
export type TSendTokenPageProps = NativeStackScreenProps<RootStackParamList, 'send', 'MyStack'>
export type TEncodedTokenPageProps = NativeStackScreenProps<RootStackParamList, 'sendToken', 'MyStack'>
export type TSuccessPageProps = NativeStackScreenProps<RootStackParamList, 'success', 'MyStack'>
export type TLightningPageProps = NativeStackScreenProps<RootStackParamList, 'lightning', 'MyStack'>
export type TPayLNInvoicePageProps = NativeStackScreenProps<RootStackParamList, 'pay invoice', 'MyStack'>
export type TMintsPageProps = NativeStackScreenProps<RootStackParamList, 'mints', 'MyStack'>
export type TMintManagementPageProps = NativeStackScreenProps<RootStackParamList, 'mintmanagement', 'MyStack'>
export type TMintInfoPageProps = NativeStackScreenProps<RootStackParamList, 'mint info', 'MyStack'>
export type TIntermintSwapPageProps = NativeStackScreenProps<RootStackParamList, 'inter-mint swap', 'MyStack'>
export type TMintBackupPageProps = NativeStackScreenProps<RootStackParamList, 'mint backup', 'MyStack'>
export type TQRScanPageProps = NativeStackScreenProps<RootStackParamList, 'qr scan', 'MyStack'>
export type THistoryPageProps = NativeStackScreenProps<RootStackParamList, 'history', 'MyStack'>
export type THistoryEntryPageProps = NativeStackScreenProps<RootStackParamList, 'history entry details', 'MyStack'>
export type TBottomNavProps =
	TDashboardPageProps |
	TLightningPageProps |
	TMintsPageProps |
	TMintManagementPageProps |
	TSendTokenPageProps |
	TPayLNInvoicePageProps |
	THistoryPageProps

/**
 * Drawer navigator
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DrawerParamList = {
	root: undefined
	Settings: undefined
	'Display settings': undefined
	'Security settings': undefined
	BackupPage: {
		token: string
	}
	'Address book': undefined
	Contact: {
		contact?: IContact
	}
}
export type TDrawerRouteString = 'root' | 'Settings' | 'Address book'
export type TSettingsPageProps = DrawerScreenProps<DrawerParamList, 'Settings'>
export type TDisplaySettingsPageProps = DrawerScreenProps<DrawerParamList, 'Display settings'>
export type TSecuritySettingsPageProps = DrawerScreenProps<DrawerParamList, 'Security settings'>
export type TBackupPageProps = DrawerScreenProps<DrawerParamList, 'BackupPage'>
export type TAddressBookPageProps = DrawerScreenProps<DrawerParamList, 'Address book'>
export type IContactPageProps = DrawerScreenProps<DrawerParamList, 'Contact'>
export type TTopNavProps = TSettingsPageProps

// Override the theme in react native navigation to accept our custom theme props.
declare module '@react-navigation/drawer' {
	export interface ExtendedTheme extends Theme {
		dark: boolean
		custom: {
			ERROR: string,
			BACKGROUND: string,
			DRAWER: string,
			TEXT: string,
			TEXT_SECONDARY: string,
			INPUT_BG: string,
			INPUT_PH: string,
			BORDER: string,
		}
	}
	export function useTheme(): ExtendedTheme
}

