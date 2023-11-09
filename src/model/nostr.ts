export type HexKey = string
export type Npub = `npub1${string}`
export type Nprofile = `nprofile1${string}`
export interface IProfileContent {
	about?: string
	banner?: string
	displayName?: string
	display_name?: string
	lud06?: string
	lud16?: string
	name?: string
	nip05?: string
	picture?: string
	username?: string
	website?: string
}

export interface IContact extends IProfileContent {
	hex: string
}
export type TUserRelays = string[]

export enum NostrPrefix {
	PublicKey = 'npub',
	PrivateKey = 'nsec',
	Note = 'note',
	// TLV prefixes
	Profile = 'nprofile',
	Event = 'nevent',
	Relay = 'nrelay',
	Address = 'naddr',
}

export interface INostrDm {
	created_at: number
	sender: string
	msg: string
	token: string
	id: string
}