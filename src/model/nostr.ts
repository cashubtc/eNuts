export interface IProfileContent {
	about: string
	banner: string
	displayName: string
	display_name: string
	lud06: string
	lud16: string
	name: string
	nip05: string
	picture: string
	username: string
	website: string
}

// [['npub', {metadata}], ['npub', {metadata}]...]
export type IContactProfile = [string, IProfileContent | undefined]

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

export type HexKey = string