export const STORE_KEYS = {
	explainer: 'init_skipped',
	// nostr
	nostrexplainer: 'nostr_explainer',
	npub: 'nostr_npub',
	npubHex: 'nostr_npubHex',
	relays: 'nostr_relays',
	nostrDms: 'nostr_dms',
	nostrRedeemed: 'nostr_redeemded',
	nutpub: 'enuts_npubHex',
	// auth
	pinSkipped: 'auth_skipped',
	lock: 'auth_lock',
	bgCounter: 'auth_bg',
	// preferences
	reqTimeout: 'request_timeout',
	lang: 'settings_lang',
	defaultMint: 'MINT_STORE=|:|=default_mint',
	hiddenBal: 'privacy_balance',
	hiddenTxs: 'privacy_txs',
	latestHistory: 'history_latest',
	createdToken: 'createdToken',
	favs: 'nostr_favs',
	synced: 'nostr_synced',
	lud16: 'nostr_lud16',
}

export const SECURESTORE_KEY = 'auth_pin'
export const SECRET = 'secret'