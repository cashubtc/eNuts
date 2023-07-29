import type { HexKey, IProfileContent } from '@model/nostr'
import { relayPool } from '@nostr/Connection'
import { defaultRelays,EventKind } from '@nostr/consts'
import { parseProfileContent } from '@src/nostr/util'
import { type Event as NostrEvent } from 'nostr-tools'
import { useEffect, useState } from 'react'

interface INostrProfileHookProps {
	pubKey?: HexKey
}

export default function useNostrProfile({ pubKey }: INostrProfileHookProps) {

	const [profile, setProfile] = useState<IProfileContent | undefined>()

	useEffect(() => {
		if (!pubKey) { return }
		// TODO use cache if available, get contact profile metadata by npub
		void (() => {
			// TODO use the users relays
			relayPool.subscribe(defaultRelays, [pubKey])
			relayPool.sub?.on('event', (e: NostrEvent) => {
				if (+e.kind === EventKind.SetMetadata) {
					setProfile(parseProfileContent<IProfileContent>(e))
					// TODO save in cache
				}
			})
		})()
	}, [pubKey])

	return {
		profile,
		pubKey
	}
}