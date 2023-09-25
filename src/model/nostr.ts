export type HexKey = string

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

export type TContact = [HexKey, IProfileContent | undefined]

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