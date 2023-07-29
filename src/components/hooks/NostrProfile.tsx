import type { HexKey, IProfileContent } from '@model/nostr'
import { getNostrProfile } from '@nostr/dataHandler'
import { useEffect, useState } from 'react'

interface INostrProfileHookProps {
	pubKey?: HexKey
}

export default function useNostrProfile({ pubKey }: INostrProfileHookProps) {

	const [profile, setProfile] = useState<IProfileContent | undefined>()
	// if pubKey available
	// check profile metadata in cache
	// if no metadata in cache, get data from user relays and save in cache
	useEffect(() => {
		if (!pubKey) { return }
		void (async() => {
			const profileData = await getNostrProfile(pubKey)
			setProfile(profileData)
		})()
	}, [pubKey])

	// if no pubKey, return pubKey


	return {
		profile,
		pubKey
	}
}