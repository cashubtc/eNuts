import { l } from '@log'
import type { HexKey, IContact, TUserRelays } from '@model/nostr'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getRedeemdedSigs } from '@store/nostrDms'
import { nip19 } from 'nostr-tools'
import { createContext, useContext, useEffect, useState } from 'react'

interface INostrState {
	nutPub: string
	pubKey: {
		encoded: string
		hex: string
	}
	userProfile?: IContact
	lud16: string
	userRelays: string[]
	favs: string[]
	recent: IContact[]
	claimedEvtIds: { [k: string]: string }
}

const useNostr = () => {
	const [nostr, setNostr] = useState<INostrState>({
		nutPub: '',
		pubKey: { encoded: '', hex: '' },
		lud16: '',
		userRelays: [],
		favs: [],
		recent: [],
		claimedEvtIds: {},
	})

	const resetNostrData = async () => {
		// clear data in context
		setNostr(prev => ({
			...prev,
			pubKey: { encoded: '', hex: '' },
			userRelays: [],
			favs: [],
			recent: [],
			claimedEvtIds: {}
		}))
		// clear stored data //
		await Promise.all([
			store.delete(STORE_KEYS.npub),
			store.delete(STORE_KEYS.npubHex),
			store.delete(STORE_KEYS.nostrDms),
			store.delete(STORE_KEYS.favs),
			store.delete(STORE_KEYS.relays),
			store.delete(STORE_KEYS.lud16),
		])
	}

	const replaceNpub = async (hex: HexKey) => {
		const npub = nip19.npubEncode(hex)
		await Promise.all([
			resetNostrData(),
			store.set(STORE_KEYS.npub, npub),
			store.set(STORE_KEYS.npubHex, hex),
		])
		setNostr(prev => ({ ...prev, pubKey: { encoded: npub, hex } }))
	}

	// init
	useEffect(() => {
		void (async () => {
			try {
				const [
					nutpub,
					claimedEvtIds,
					favs,
					recent,
					lud16,
					npub,
					hex,
					userRelays,
				] = await Promise.all([
					// user enuts pubKey
					store.get(STORE_KEYS.nutpub),
					// already claimed ecash from DM: stored event signatures
					getRedeemdedSigs(),
					store.getObj<string[]>(STORE_KEYS.favs),
					store.getObj<IContact[]>(STORE_KEYS.nostrDms),
					store.get(STORE_KEYS.lud16),
					store.get(STORE_KEYS.npub),
					store.get(STORE_KEYS.npubHex),
					store.getObj<TUserRelays>(STORE_KEYS.relays),
				])
				setNostr(prev => ({
					...prev,
					nutPub: nutpub ?? '',
					favs: favs ?? [],
					recent: recent ?? [],
					lud16: lud16 ?? '',
					pubKey: { encoded: npub ?? '', hex: hex ?? '' },
					userRelays: userRelays ?? [],
					claimedEvtIds,
				}))
			} catch (e) {/* ignore */ }
		})()
	}, [])

	return {
		nostr,
		setNostr,
		resetNostrData,
		replaceNpub
	}
}
type useNostrType = ReturnType<typeof useNostr>
const NostrContext = createContext<useNostrType>({
	nostr: {
		nutPub: '',
		pubKey: { encoded: '', hex: '' },
		lud16: '',
		userRelays: [],
		favs: [],
		recent: [],
		claimedEvtIds: {},
	},
	setNostr: () => l(''),
	// eslint-disable-next-line @typescript-eslint/await-thenable, no-return-await
	resetNostrData: async () => await l(''),
	// eslint-disable-next-line @typescript-eslint/await-thenable, no-return-await
	replaceNpub: async (hex: HexKey) => await l(hex),
})

export const useNostrContext = () => useContext(NostrContext)

export const NostrProvider = ({ children }: { children: React.ReactNode }) => (
	<NostrContext.Provider value={useNostr()} >
		{children}
	</NostrContext.Provider>
)