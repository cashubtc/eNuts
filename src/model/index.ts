import type { Proof, Token } from '@cashu/cashu-ts'
import type { HighlightKey } from '@styles'
import type { ExpoConfig } from 'expo/config'
import type { SQLStmtCb, SQLStmtErrCb, WebSQLDatabase } from 'expo-sqlite'

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

export interface IHistoryEntry {
	amount: number
	type: 1 | 2 // LN invoice or cashu token
	timestamp: number
	value: string
	mints: string[]
	preImage?: string,
	fee?: number,
	isSpent?: boolean
}


export interface IInvoice {
	pr: string,
	hash: string,
	amount: number,
	time: number,
	mintUrl: string
}
export interface IOpenDBParams {
	name: string,
	version?: string,
	description?: string,
	size?: number,
	callback?: ((db: WebSQLDatabase) => void)
}
export interface IOpenDB {
	(
		name: string,
		version?: string,
		description?: string,
		size?: number,
		callback?: ((db: WebSQLDatabase) => void)
	): WebSQLDatabase
}
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