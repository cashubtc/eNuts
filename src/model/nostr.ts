export enum EventKind {
	Unknown = -1,
	SetMetadata = 0,
	TextNote = 1,
	RecommendServer = 2,
	ContactList = 3, 			// NIP-02
	DirectMessage = 4, 			// NIP-04
	Deletion = 5, 				// NIP-09
	Repost = 6, 				// NIP-18
	Reaction = 7, 				// NIP-25
	BadgeAward = 8, 			// NIP-58
	SnortSubscriptions = 1000, 	// NIP-XX
	Polls = 6969, 				// NIP-69
	FileHeader = 1063, 			// NIP-94
	Relays = 10002, 			// NIP-65
	Ephemeral = 20_000,
	Auth = 22242, 				// NIP-42
	PubkeyLists = 30000, 		// NIP-51a
	NoteLists = 30001, 			// NIP-51b
	TagLists = 30002, 			// NIP-51c
	Badge = 30009, 				// NIP-58
	ProfileBadges = 30008, 		// NIP-58
	ZapRequest = 9734, 			// NIP 57
	ZapReceipt = 9735, 			// NIP 57
	HttpAuthentication = 27235, // NIP XX - HTTP Authentication
}

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