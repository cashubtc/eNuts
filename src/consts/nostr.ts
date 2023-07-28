/**
 * Default bootstrap relays
 */
export const defaultRelays = [
	'wss://relay.snort.social',
	'wss://relay.damus.io',
	'wss://nostr-pub.wellorder.net',
	'wss://nostr.mom',
	'wss://4.up.railway.app',
	'wss://eden.nostr.land',
	'wss://nostr-relay.untethr.me',
	'wss://nostr.zebedee.social',
	'wss://offchain.pub',
	'wss://nostr.fmt.wiz.biz',
	'wss://nostr-relay.wlvs.space',
	'wss://nostr.fly.dev',
	'wss://nostr.nostr.band',
	'wss://relay.realsearch.cc',
	'wss://relay.nostrgraph.net',
	'wss://relay.minds.com/nostr/v1/ws',
	'wss://nos.lol/'
]

export const npubLength = 64

/**
 * Regex to match a mnemonic seed
 */
export const MnemonicRegex = /(\w+)/g

/**
 * NIP06-defined derivation path for private keys
 */
export const DerivationPath = 'm/44\'/1237\'/0\'/0/0'

/**
 * Websocket re-connect timeout
 */
export const defaultConnectTimeout = 2000