import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import type { IHistoryEntry, IMintUrl, IMintWithBalance, IProofSelection } from '.'
import { IProfileContent } from './nostr'

interface INostrProps {
	senderName: string
	receiverNpub: string
	receiverName?: string
}
/**
 * Stack Navigator
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamList = {
	onboarding: undefined
	'nostr onboarding': undefined
	dashboard: undefined
	disclaimer: undefined
	history: undefined
	mints: {
		newMint?: boolean
	} | undefined
	Settings: undefined
	'General settings': undefined
	'Security settings': undefined
	'Privacy settings': undefined
	'Display settings': undefined
	'Language settings': undefined
	'Advanced settings': undefined
	'About settings': undefined
	auth: {
		pinHash: string
		shouldEdit?: boolean
		shouldRemove?: boolean
	}
	selectMint: {
		mints: IMintUrl[]
		mintsWithBal: IMintWithBalance[]
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrProps
		balance?: number
		allMintsEmpty?: boolean
		invoice?: string
		invoiceAmount?: number
	},
	selectTarget: {
		mint: IMintUrl
		balance: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrProps
		remainingMints?: IMintUrl[]
	}
	meltInputfield: {
		mint: IMintUrl
		balance: number
	}
	selectMintToSwapTo: {
		mint: IMintUrl
		balance: number
		remainingMints?: IMintUrl[]
	}
	selectAmount: {
		mint: IMintUrl
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrProps
		isSwap?: boolean
		balance: number
		lnurl?: string
		targetMint?: IMintUrl
	}
	memoScreen: {
		mint: IMintUrl
		balance: number
		amount: number
		isSendingWholeMintBal: boolean,
		nostr?: INostrProps
	}
	coinSelection: {
		mint: IMintUrl
		balance: number
		amount: number
		estFee: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrProps
		isSwap?: boolean
		targetMint?: IMintUrl
		recipient?: string
		memo?: string
	}
	nostrReceive: undefined
	processing: {
		mint: IMintUrl
		amount: number
		estFee?: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrProps
		isSwap?: boolean
		targetMint?: IMintUrl
		proofs?: IProofSelection[]
		recipient?: string
		memo?: string
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
	encodedToken: {
		token: string
		amount: number
	}
	success: {
		amount?: number
		fee?: number
		mint?: string
		memo?: string
		isClaim?: boolean
		isMelt?: boolean
		nostr?: INostrProps
	}
	mintmanagement: {
		mint: IMintUrl
		amount: number
		// mint_key: string
	}
	'mint info': {
		mintUrl: string
	}
	'mint backup': {
		token: string
		mintUrl: string
	}
	'mint proofs': {
		mintUrl: string
	}
	'qr scan': {
		mint?: IMintUrl
		balance?: number
	}
	'history entry details': {
		entry: IHistoryEntry
	}
	BackupPage: {
		token: string
	}
	'Address book'?: {
		isMelt?: boolean
		mint: IMintUrl
		balance: number
		isSendEcash?: boolean
	}
	Contact: {
		contact?: IProfileContent
		npub: string
		isUser?: boolean
		userProfile?: IProfileContent
	}
}

export type TRouteString = 'dashboard' | 'mints' | 'Address book' | 'Settings'
export type TOnboardingPageProps = NativeStackScreenProps<RootStackParamList, 'onboarding', 'MyStack'>
export type TNostrOnboardingPageProps = NativeStackScreenProps<RootStackParamList, 'nostr onboarding', 'MyStack'>
export type TSelectMintPageProps = NativeStackScreenProps<RootStackParamList, 'selectMint', 'MyStack'>
export type TSelectTargetPageProps = NativeStackScreenProps<RootStackParamList, 'selectTarget', 'MyStack'>
export type TSelectMintToSwapToPageProps = NativeStackScreenProps<RootStackParamList, 'selectMintToSwapTo', 'MyStack'>
export type TMeltInputfieldPageProps = NativeStackScreenProps<RootStackParamList, 'meltInputfield', 'MyStack'>
export type TSelectAmountPageProps = NativeStackScreenProps<RootStackParamList, 'selectAmount', 'MyStack'>
export type TMemoPageProps = NativeStackScreenProps<RootStackParamList, 'memoScreen', 'MyStack'>
export type TCoinSelectionPageProps = NativeStackScreenProps<RootStackParamList, 'coinSelection', 'MyStack'>
export type TNostrReceivePageProps = NativeStackScreenProps<RootStackParamList, 'nostrReceive', 'MyStack'>
export type TProcessingPageProps = NativeStackScreenProps<RootStackParamList, 'processing', 'MyStack'>
export type TProcessingErrorPageProps = NativeStackScreenProps<RootStackParamList, 'processingError', 'MyStack'>
export type TMintInvoicePageProps = NativeStackScreenProps<RootStackParamList, 'mintInvoice', 'MyStack'>
export type TDashboardPageProps = NativeStackScreenProps<RootStackParamList, 'dashboard', 'MyStack'>
export type TDisclaimerPageProps = NativeStackScreenProps<RootStackParamList, 'disclaimer', 'MyStack'>
export type TAuthPageProps = NativeStackScreenProps<RootStackParamList, 'auth', 'MyStack'>
export type TEncodedTokenPageProps = NativeStackScreenProps<RootStackParamList, 'encodedToken', 'MyStack'>
export type TSuccessPageProps = NativeStackScreenProps<RootStackParamList, 'success', 'MyStack'>
export type TMintsPageProps = NativeStackScreenProps<RootStackParamList, 'mints', 'MyStack'>
export type TMintManagementPageProps = NativeStackScreenProps<RootStackParamList, 'mintmanagement', 'MyStack'>
export type TMintInfoPageProps = NativeStackScreenProps<RootStackParamList, 'mint info', 'MyStack'>
export type TMintBackupPageProps = NativeStackScreenProps<RootStackParamList, 'mint backup', 'MyStack'>
export type TMintProofsPageProps = NativeStackScreenProps<RootStackParamList, 'mint proofs', 'MyStack'>
export type TQRScanPageProps = NativeStackScreenProps<RootStackParamList, 'qr scan', 'MyStack'>
export type THistoryPageProps = NativeStackScreenProps<RootStackParamList, 'history', 'MyStack'>
export type THistoryEntryPageProps = NativeStackScreenProps<RootStackParamList, 'history entry details', 'MyStack'>
export type TSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Settings'>
export type TGeneralSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'General settings'>
export type TDisplaySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Display settings'>
export type TSecuritySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Security settings'>
export type TPrivacySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Privacy settings'>
export type TLanguageSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Language settings'>
export type TAdvancedSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Advanced settings'>
export type TAboutSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'About settings'>
export type TBackupPageProps = NativeStackScreenProps<RootStackParamList, 'BackupPage'>
export type TAddressBookPageProps = NativeStackScreenProps<RootStackParamList, 'Address book'>
export type IContactPageProps = NativeStackScreenProps<RootStackParamList, 'Contact'>
export type TBottomNavProps =
	TNostrOnboardingPageProps |
	TDashboardPageProps |
	TMintsPageProps |
	TMintManagementPageProps |
	THistoryPageProps |
	THistoryEntryPageProps |
	TMintProofsPageProps |
	TAddressBookPageProps |
	TBackupPageProps |
	TSettingsPageProps |
	TGeneralSettingsPageProps |
	TSecuritySettingsPageProps |
	TDisplaySettingsPageProps |
	TPrivacySettingsPageProps |
	IContactPageProps
export interface INavigatorProps {
	pinHash: string
	// shouldSetup?: boolean
	bgAuth?: boolean
	shouldOnboard?: boolean
	setBgAuth?: (val: boolean) => void
}