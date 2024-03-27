import type { EventArg } from '@react-navigation/core'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import type { IHistoryEntry, ILnUrlPayRequest, IMintUrl, IMintWithBalance, IProofSelection, ITokenInfo } from '.'
import type { HexKey, IContact } from './nostr'

export interface INostrSendData {
	senderName: string
	contact?: IContact
}

interface ILnurlNavData {
	userInput: string
	url?: string
	data?: ILnUrlPayRequest
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
		defaultMint?: boolean
		newMint?: boolean
	} | undefined
	Settings: undefined
	'General settings': undefined
	'Security settings': undefined
	'Privacy settings': undefined
	'Display settings': undefined
	'Language settings': undefined
	'Advanced settings': undefined
	'Contacts settings': undefined
	'About settings': undefined
	auth: {
		pinHash: string
		shouldEdit?: boolean
		shouldRemove?: boolean
		sawSeedUpdate?: boolean
	}
	selectMint: {
		mints: IMintUrl[]
		mintsWithBal: IMintWithBalance[]
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrSendData
		balance?: number
		allMintsEmpty?: boolean
		invoice?: string
		invoiceAmount?: number
		estFee?: number
		lnurl?: ILnurlNavData
		scanned?: boolean
	},
	selectTarget: {
		mint: IMintUrl
		balance: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrSendData
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
		nostr?: INostrSendData
		isSwap?: boolean
		balance: number
		lnurl?: ILnurlNavData
		targetMint?: IMintUrl
		scanned?: boolean
	}
	selectNostrAmount: {
		mint: IMintUrl
		nostr?: INostrSendData
		balance: number
	}
	coinSelection: {
		mint: IMintUrl
		balance: number
		amount: number
		estFee: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrSendData
		isSwap?: boolean
		isZap?: boolean
		targetMint?: IMintUrl
		recipient?: string
		memo?: string
		scanned?: boolean
	}
	nostrReceive: undefined
	processing: {
		mint: IMintUrl
		tokenInfo?: ITokenInfo
		amount: number
		estFee?: number
		isMelt?: boolean
		isSendEcash?: boolean
		nostr?: INostrSendData
		isSwap?: boolean
		isAutoSwap?: boolean
		isZap?: boolean
		payZap?: boolean
		targetMint?: IMintUrl
		proofs?: IProofSelection[]
		recipient?: string
		memo?: string
	}
	'qr processing': {
		tokenInfo?: ITokenInfo
		token?: string
		scanned?: boolean
		ln?: {
			invoice: string
			mint?: IMintUrl
			balance?: number
			amount: number
		}
		lnurl?: {
			mint?: IMintUrl
			balance?: number
			url: string
			data: string
		}
	}
	'mint confirm': {
		mintUrl: string
	}
	'npub confirm': {
		hex: HexKey
		isPayment?: boolean
	}
	'scan success': {
		mintUrl?: string
		hex?: HexKey
		edited?: boolean
		userProfile?: IContact
	}
	processingError: {
		mint?: IMintUrl
		amount?: number
		scan?: boolean
		comingFromOnboarding?: boolean
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
		entry: IHistoryEntry
	}
	success: {
		amount?: number
		fee?: number
		mint?: string
		memo?: string
		isClaim?: boolean
		isMelt?: boolean
		isAutoSwap?: boolean
		isZap?: boolean
		nostr?: INostrSendData
		isScanned?: boolean
		isRestored?: boolean
		change?: number
		comingFromOnboarding?: boolean
	}
	mintmanagement: {
		mint: IMintUrl
		amount: number
		remainingMints: IMintUrl[]
	}
	'mint info': {
		mintUrl: string
	}
	'mint proofs': {
		mintUrl: string
	}
	'qr scan': {
		mint?: IMintUrl
		balance?: number
		isPayment?: boolean
	}
	'history entry details': {
		entry: IHistoryEntry
	}
	'Address book'?: {
		isMelt?: boolean
		mint: IMintUrl
		balance: number
		isSendEcash?: boolean
	}
	Contact: {
		contact?: IContact // the contact in users contact list
		isUser?: boolean
		userProfile?: IContact // the user profile
	}
	Seed: {
		comingFromOnboarding?: boolean
		sawSeedUpdate?: boolean
		hasSeed?: boolean
	} | undefined
	'Select recovery mint': {
		comingFromOnboarding?: boolean
	}
	Recover: {
		mintUrl: string
		comingFromOnboarding?: boolean
	}
	Mnemonic: {
		comingFromOnboarding?: boolean
	}
	'Confirm Mnemonic': {
		mnemonic: string[]
		comingFromOnboarding?: boolean
	}
	Deriving: {
		mnemonic: string[]
		comingFromOnboarding?: boolean
	}
	Recovering: {
		mintUrl: string
		mnemonic: string
		comingFromOnboarding?: boolean
	}
	'Restore warning': {
		comingFromOnboarding?: boolean
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
export type TSelectNostrAmountPageProps = NativeStackScreenProps<RootStackParamList, 'selectNostrAmount', 'MyStack'>
export type TCoinSelectionPageProps = NativeStackScreenProps<RootStackParamList, 'coinSelection', 'MyStack'>
export type TNostrReceivePageProps = NativeStackScreenProps<RootStackParamList, 'nostrReceive', 'MyStack'>
export type TProcessingPageProps = NativeStackScreenProps<RootStackParamList, 'processing', 'MyStack'>
export type TQRProcessingPageProps = NativeStackScreenProps<RootStackParamList, 'qr processing', 'MyStack'>
export type TMintConfirmPageProps = NativeStackScreenProps<RootStackParamList, 'mint confirm', 'MyStack'>
export type TNpubConfirmPageProps = NativeStackScreenProps<RootStackParamList, 'npub confirm', 'MyStack'>
export type TScanSuccessPageProps = NativeStackScreenProps<RootStackParamList, 'scan success', 'MyStack'>
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
export type TMintProofsPageProps = NativeStackScreenProps<RootStackParamList, 'mint proofs', 'MyStack'>
export type TQRScanPageProps = NativeStackScreenProps<RootStackParamList, 'qr scan', 'MyStack'>
export type THistoryPageProps = NativeStackScreenProps<RootStackParamList, 'history', 'MyStack'>
export type THistoryEntryPageProps = NativeStackScreenProps<RootStackParamList, 'history entry details', 'MyStack'>
export type TSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Settings'>
export type TGeneralSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'General settings'>
export type TDisplaySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Display settings'>
export type TSecuritySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Security settings'>
export type TPrivacySettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Privacy settings'>
export type TNostrSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Contacts settings'>
export type TLanguageSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Language settings'>
export type TAdvancedSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'Advanced settings'>
export type TAboutSettingsPageProps = NativeStackScreenProps<RootStackParamList, 'About settings'>
export type TAddressBookPageProps = NativeStackScreenProps<RootStackParamList, 'Address book'>
export type IContactPageProps = NativeStackScreenProps<RootStackParamList, 'Contact'>
export type ISeedPageProps = NativeStackScreenProps<RootStackParamList, 'Seed'>
export type IRecoverPageProps = NativeStackScreenProps<RootStackParamList, 'Recover'>
export type IMnemonicPageProps = NativeStackScreenProps<RootStackParamList, 'Mnemonic'>
export type IConfirmMnemonicPageProps = NativeStackScreenProps<RootStackParamList, 'Confirm Mnemonic'>
export type IDerivingPageProps = NativeStackScreenProps<RootStackParamList, 'Deriving'>
export type IRecoveringPageProps = NativeStackScreenProps<RootStackParamList, 'Recovering'>
export type ISelectRecoveryMintPageProps = NativeStackScreenProps<RootStackParamList, 'Select recovery mint'>
export type IRestoreWarningPageProps = NativeStackScreenProps<RootStackParamList, 'Restore warning'>
export type TBottomNavProps =
	TNostrOnboardingPageProps |
	TDashboardPageProps |
	TMintsPageProps |
	TMintManagementPageProps |
	THistoryPageProps |
	THistoryEntryPageProps |
	TMintProofsPageProps |
	TAddressBookPageProps |
	TSettingsPageProps |
	TGeneralSettingsPageProps |
	TSecuritySettingsPageProps |
	TDisplaySettingsPageProps |
	TPrivacySettingsPageProps |
	TNostrSettingsPageProps |
	IContactPageProps
export interface INavigatorProps {
	pinHash: string
	// shouldSetup?: boolean
	bgAuth?: boolean
	shouldOnboard?: boolean
	setBgAuth?: (val: boolean) => void
	hasSeed?: boolean
	sawSeedUpdate?: boolean
}
export type TBeforeRemoveEvent = EventArg<'beforeRemove', true, {
	action: Readonly<{
		type: string
		payload?: object | undefined
		source?: string | undefined
		target?: string | undefined
	}>
}>