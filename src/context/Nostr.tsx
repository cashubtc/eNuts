import { l } from '@log'
import type { HexKey, IContact, TUserRelays } from '@model/nostr'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getRedeemdedSigs } from '@store/nostrDms'
import { nip19 } from 'nostr-tools'
import { createContext, useContext, useEffect, useState } from 'react'

const useNostr = () => {
	// TODO this could be summarized in 1 object and 1 useState
	const [nutPub, setNutPub] = useState('')
	const [pubKey, setPubKey] = useState({ encoded: '', hex: '' })
	const [userProfile, setUserProfile] = useState<IContact | undefined>()
	const [lud16, setLud16] = useState('')
	const [userRelays, setUserRelays] = useState<string[]>([])
	const [favs, setFavs] = useState<string[]>([])
	const [recent, setRecent] = useState<IContact[]>([])
	const [claimedEvtIds, setClaimedEvtIds] = useState<{ [k: string]: string }>({})

	const resetNostrData = async () => {
		// clear data in context
		setPubKey({ encoded: '', hex: '' })
		setUserProfile(undefined)
		setUserRelays([])
		setFavs([])
		setRecent([])
		setClaimedEvtIds({})
		// clear stored data
		await Promise.allSettled([
			store.delete(STORE_KEYS.npub),
			store.delete(STORE_KEYS.npubHex),
			store.delete(STORE_KEYS.nostrDms),
			store.delete(STORE_KEYS.favs),
			store.delete(STORE_KEYS.relays),
			store.delete(STORE_KEYS.synced),
			store.delete(STORE_KEYS.lud16)
		])
	}

	const replaceNpub = async (hex: HexKey) => {
		const npub = nip19.npubEncode(hex)
		await Promise.allSettled([
			resetNostrData(),
			store.set(STORE_KEYS.npub, npub),
			store.set(STORE_KEYS.npubHex, hex),
		])
		setPubKey({ encoded: npub, hex })
	}

	// init
	useEffect(() => {
		void (async () => {
			try {
				const [
					nutpub,
					redeemed,
					nostrFavs,
					nostrRecent,
					lud16,
					storedNPub,
					storedPubKeyHex,
					storedUserRelays,
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
				setNutPub(nutpub || '')
				setClaimedEvtIds(redeemed)
				setFavs(nostrFavs || [])
				setRecent(nostrRecent?.reverse() || [])
				setLud16(lud16 || '')
				setPubKey({ encoded: storedNPub || '', hex: storedPubKeyHex || '' })
				setUserRelays(storedUserRelays || [])
			} catch (e) {
				l(e)
			}
		})()
	}, [])

	return {
		nutPub,
		setNutPub,
		pubKey,
		setPubKey,
		userProfile,
		setUserProfile,
		lud16,
		setLud16,
		userRelays,
		setUserRelays,
		recent,
		setRecent,
		favs,
		setFavs,
		claimedEvtIds,
		setClaimedEvtIds,
		resetNostrData,
		replaceNpub
	}
}
type useNostrType = ReturnType<typeof useNostr>
const NostrContext = createContext<useNostrType>({
	nutPub: '',
	setNutPub: () => l(''),
	pubKey: { encoded: '', hex: '' },
	setPubKey: () => l(''),
	userProfile: {
		about: '',
		banner: '',
		displayName: '',
		display_name: '',
		lud06: '',
		lud16: '',
		name: '',
		nip05: '',
		picture: '',
		username: '',
		website: '',
		hex: ''
	},
	setUserProfile: () => l(''),
	lud16: '',
	setLud16: () => l(''),
	userRelays: [],
	setUserRelays: () => l(''),
	recent: [],
	setRecent: () => l(''),
	favs: [],
	setFavs: () => l(''),
	claimedEvtIds: {},
	setClaimedEvtIds: () => l(''),
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