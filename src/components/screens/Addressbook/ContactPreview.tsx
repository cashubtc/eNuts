import Txt from '@comps/Txt'
import { l } from '@log'
import type { HexKey, IContactProfile, IProfileContent } from '@model/nostr'
import { truncateNpub } from '@nostr/util'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'

import Username from './Username'

interface IContactPreviewProps {
	pubKey: HexKey
	visibleItems: string[]
	handleContactPress: () => void
}

export default function ContactPreview({ pubKey, visibleItems, handleContactPress }: IContactPreviewProps) {
	const [metadata, setMetadata] = useState<IProfileContent | undefined>()

	useEffect(() => {
		if (metadata) { return }
		const isInView = visibleItems.some(item => item === pubKey)
		if (!isInView) { return }
		l('no metadata and item is in view, get metadata!')
		// TODO use cache if available

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visibleItems])

	return (
		<TouchableOpacity onPress={handleContactPress}>
			{metadata ?
				<Username
					displayName={metadata?.displayName}
					username={metadata?.username}
					npub={truncateNpub(nip19.npubEncode(pubKey))}
				/>
				:
				<Txt txt={pubKey} />
			}
		</TouchableOpacity>
	)
}
