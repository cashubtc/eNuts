import { l } from '@log'
import type { IProfileContent, TContact } from '@model/nostr'
import { createContext, useState } from 'react'

const useNostr = () => {
	const [nutPub, setNutPub] = useState('')
	const [pubKey, setPubKey] = useState({ encoded: '', hex: '' })
	const [userProfile, setUserProfile] = useState<IProfileContent | undefined>()
	const [userRelays, setUserRelays] = useState<string[]>([])
	const [contacts, setContacts] = useState<TContact[]>([])
	const [claimedEvtIds, setClaimedEvtIds] = useState<string[]>([])
	return {
		nutPub,
		setNutPub,
		pubKey,
		setPubKey,
		userProfile,
		setUserProfile,
		userRelays,
		setUserRelays,
		contacts,
		setContacts,
		claimedEvtIds,
		setClaimedEvtIds
	}
}
type useNostrType = ReturnType<typeof useNostr>
export const NostrContext = createContext<useNostrType>({
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
	},
	setUserProfile: () => l(''),
	userRelays: [],
	setUserRelays: () => l(''),
	contacts: [],
	setContacts: () => l(''),
	claimedEvtIds: [],
	setClaimedEvtIds: () => l(''),
})