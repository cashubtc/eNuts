import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { IContact } from '@src/context/Contacts'

import type { IHistoryEntry, IMintUrl, IMintWithBalance, IProofSelection } from '.'

/**
 * Stack Navigator
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamList = {
	// new UX
	selectMint: {
		mints: IMintUrl[]
		mintsWithBal: IMintWithBalance[]
		isMelt?: boolean
		isSendEcash?: boolean
		balance?: number
		allMintsEmpty?: boolean
	},
	selectTarget: {
		mint: IMintUrl
		balance?: number
	}
	meltInputfield: {
		mint: IMintUrl
		balance: number
	}
	selectAmount: {
		mint: IMintUrl
		isMelt?: boolean
		isSendEcash?: boolean
		balance?: number
		lnurl?: string
	}
	coinSelection: {
		mint: IMintUrl
		amount: number
		estFee: number
		isMelt?: boolean
		isSendEcash?: boolean
		recipient: string
	}
	processing: {
		mint: IMintUrl
		amount: number
		isMelt?: boolean
		proofs?: IProofSelection[]
		recipient?: string
	}
	processingError: {
		mint: IMintUrl
		amount: number
		errorMsg: string
	},
	mintInvoice: {
		mintUrl: string
		amount: number
		hash: string
		expiry: number
		paymentRequest: string
	}
	//
	dashboard: undefined
	disclaimer: undefined
	auth: {
		pinHash: string
		shouldEdit?: boolean
		shouldRemove?: boolean
	}
	send: undefined
	sendToken: {
		token: string
		amount: string
	}
	success: {
		amount?: number
		fee?: number
		mint?: string
		mints?: string[]
		memo?: string
	}
	lightning: {
		mint?: IMintUrl
		balance?: number
		receive?: boolean
		send?: boolean
	} | undefined
	'pay invoice': {
		mint?: IMintUrl
		mintBal: number
	}
	mints: undefined
	mintmanagement: {
		mint: IMintUrl
		amount: number
		// mint_key: string
	}
	'mint info': {
		mintUrl: string
	}
	'inter-mint swap': {
		swap_out_mint: {
			mintUrl: string
			customName: string
		}
		mints: IMintUrl[]
		balance: number
	}
	'mint backup': {
		token: string
		mintUrl: string
	}
	'mint proofs': {
		mintUrl: string
	}
	'qr scan': undefined
	'history': undefined
	'history entry details': {
		entry: IHistoryEntry
	}
	Settings: undefined
	'Display settings': undefined
	'Security settings': undefined
	'Language settings': undefined
	'About settings': undefined
	BackupPage: {
		token: string
	}
	'Address book': {
		isMelt: boolean
		mint: IMintUrl
		balance: number
	} | undefined
	Contact: {
		contact?: IContact
	}
}

export type TRouteString = 'dashboard' | 'lightning' | 'mints' | 'history' | 'Address book' | 'Settings'
// new UX
export type TSelectMintPageProps = NativeStackScreenProps<RootStackParamList, 'selectMint', 'MyStack'>
export type TSelectTargetPageProps = NativeStackScreenProps<RootStackParamList, 'selectTarget', 'MyStack'>
export type TMeltInputfieldPageProps = NativeStackScreenProps<RootStackParamList, 'meltInputfield', 'MyStack'>
export type TSelectAmountPageProps = NativeStackScreenProps<RootStackParamList, 'selectAmount', 'MyStack'>
export type TCoinSelectionPageProps = NativeStackScreenProps<RootStackParamList, 'coinSelection', 'MyStack'>
export type TProcessingPageProps = NativeStackScreenProps<RootStackParamList, 'processing', 'MyStack'>
export type TProcessingErrorPageProps = NativeStackScreenProps<RootStackParamList, 'processingError', 'MyStack'>
export type TMintInvoicePageProps = NativeStackScreenProps<RootStackParamList, 'mintInvoice', 'MyStack'>

//
export type TDashboardPageProps = NativeStackScreenProps<RootStackParamList, 'dashboard', 'MyStack'>
export type TDisclaimerPageProps = NativeStackScreenProps<RootStackParamList, 'disclaimer', 'MyStack'>
export type TAuthPageProps = NativeStackScreenProps<RootStackParamList, 'auth', 'MyStack'>
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
export type TMintProofsPageProps = NativeStackScreenProps<RootStackParamList, 'mint proofs', 'MyStack'>
export type TQRScanPageProps = NativeStackScreenProps<RootStackParamList, 'qr scan', 'MyStack'>
export type THistoryPageProps = NativeStackScreenProps<RootStackParamList, 'history', 'MyStack'>
export type THistoryEntryPageProps = NativeStackScreenProps<RootStackParamList, 'history entry details', 'MyStack'>
export type TSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Settings'>
export type TDisplaySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Display settings'>
export type TSecuritySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Security settings'>
export type TLanguageSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Language settings'>
export type TAboutSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'About settings'>
export type TBackupPageProps = NativeStackScreenProps<RootStackParamList, 'BackupPage'>
export type TAddressBookPageProps = NativeStackScreenProps<RootStackParamList, 'Address book'>
export type IContactPageProps = NativeStackScreenProps<RootStackParamList, 'Contact'>
export type TBottomNavProps =
	TDashboardPageProps |
	TLightningPageProps |
	TMintsPageProps |
	TMintManagementPageProps |
	TSendTokenPageProps |
	TPayLNInvoicePageProps |
	THistoryPageProps |
	THistoryEntryPageProps |
	TMintProofsPageProps |
	TAddressBookPageProps |
	TBackupPageProps |
	TSecuritySettingsPageProps |
	TDisplaySettingsPageProps |
	TSettingsPageProps |
	IContactPageProps
export interface INavigatorProps {
	pinHash: string
	shouldSetup?: boolean
	bgAuth?: boolean
	setBgAuth?: (val: boolean) => void
}