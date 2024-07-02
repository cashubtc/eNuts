import type { PayLnInvoiceResponse, Proof, Token } from '@cashu/cashu-ts'
import type { HighlightKey } from '@styles'
import type { ExpoConfig } from 'expo/config'
import type { SQLStmtCb, SQLStmtErrCb } from 'expo-sqlite/legacy'

export interface IExpoConfig extends ExpoConfig {
	extra?: {
		DEBUG?: string // | 'full'
		NODE_ENV?: string // | 'development' | 'production' | 'test' | 'preview'
		NODE_ENV_SHORT?: string // | 'prod' | 'dev' | 'test' | 'preview'
		APP_VARIANT?: string // | 'prod' | 'dev' | 'test' | 'preview'
		SENTRY_DSN?: string
	}
}
export interface IInitialProps {
	expo?: IExpoConfig
	exp: {
		notification?: any
		manifestString?: string;
		[key: string]: any
	}
	shell?: boolean
	shellManifestUrl?: string
	[key: string]: any
}
export interface ILnUrl {
	tag: string
	minSendable: number
	maxSendable: number
	callback: string
	pr: string
}

// TODO This interface is missing some properties?
export interface ILnUrlPayRequest {
	tag: string
	cb: string
	minSendable: number
	maxSendable: number
	metadata: string
}
export interface IMint {
	id: string
	mintUrl: string
}

export interface IMintUrl {
	mintUrl: string
	customName?: string
}

export interface IMintWithBalance {
	mintUrl: string
	amount: number
}

export interface IMintBalWithName extends IMintWithBalance {
	customName: string
}

export interface ITokenInfo {
	mints: string[]
	value: number
	decoded: Token
}

export interface IPreferencesResp {
	id: 1
	formatBalance: string
	darkmode: string
	theme: HighlightKey
	hasPref: string
}

export interface IPreferences {
	id: 1
	formatBalance: boolean
	darkmode: boolean
	theme: HighlightKey
	hasPref: boolean
}

export interface IContactResp {
	id?: number
	name: string,
	ln: string,
	isOwner: string
}

export interface IProofSelection extends Proof {
	selected: boolean
}

export enum txType {
	SEND_RECEIVE = 1,
	LIGHTNING = 2,
	SWAP = 3,
	RESTORE = 4
}

export type TTXType = txType.SEND_RECEIVE | txType.LIGHTNING | txType.SWAP | txType.RESTORE

/**
 * type: 1 | 2 | 3
 * 1 = send/receive Ecash
 * 2 = LN invoice
 * 3 = multimint swap
 * 4 = restored from backup
 */
export interface IHistoryEntry {
	amount: number
	type: TTXType
	timestamp: number
	value: string		// Lightning invoice or encoded Cashu token
	mints: string[] 	// mints involved
	sender?: string 	// sender (nostr username)
	recipient?: string 	// recipient (nostr username)
	preImage?: string,
	fee?: number,
	isSpent?: boolean 	// is token spendable
	isPending?: boolean // is LN invoice pending
	isExpired?: boolean // is LN invoice expired
}


export interface IInvoice {
	pr: string,
	hash: string,
	amount: number,
	time: number,
	mintUrl: string
}
// export interface IOpenDBParams {
// 	name: string,
// 	version?: string,
// 	description?: string,
// 	size?: number,
// 	callback?: ((db: WebSQLDatabase) => void)
// }
// export interface IOpenDB {
// 	(
// 		name: string,
// 		version?: string,
// 		description?: string,
// 		size?: number,
// 		callback?: ((db: WebSQLDatabase) => void)
// 	): WebSQLDatabase
// }
export type QueryArgs = (number | string | null)[]
export interface ITx<T = unknown> {
	sql: string,
	args?: QueryArgs,
	cb?: SQLStmtCb<T>,
	errorCb?: SQLStmtErrCb
}
export interface IKeyValuePair<T> {
	key: string,
	value: T
}

export interface IContact {
	id?: number
	name: string,
	ln: string,
	isOwner: boolean
}
export interface IPromptState {
	open: boolean
	success?: boolean
	msg: string
}

export interface IOpenPromptAutoCloseProps {
	msg: string
	success?: boolean
	ms?: number
}

export type TPayLnInvoiceReturnType = Promise<{ result?: PayLnInvoiceResponse, fee?: number, realFee?: number, error?: unknown }>

export type TRequestTokenReturnType = Promise<{ success: boolean; invoice: IInvoice | null | undefined }>

export interface ISecret {
	secret: string
}