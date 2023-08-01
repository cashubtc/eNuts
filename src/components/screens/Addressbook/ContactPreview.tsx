import Txt from '@comps/Txt'
import { l } from '@log'
import type { HexKey, IProfileContent } from '@model/nostr'
import { relay } from '@nostr/class/Relay'
import { EventKind } from '@nostr/consts'
import { parseProfileContent, truncateAbout, truncateNpub } from '@nostr/util'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { type Event as NostrEvent, nip19 } from 'nostr-tools'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type GestureResponderEvent, StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	pubKey: HexKey
	visibleItems: string[]
	handleContactPress: () => void
}

export default function ContactPreview({ pubKey, visibleItems, handleContactPress }: IContactPreviewProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [metadata, setMetadata] = useState<IProfileContent | undefined>()

	const handleSend = (e: GestureResponderEvent) => {
		e.stopPropagation()
		l('send ecash')
		//
	}

	useEffect(() => {
		// visibleItems is empty once end of list has been reached
		if (
			metadata ||
			!visibleItems.length ||
			!visibleItems.some(item => item === pubKey)
		) { return }
		l('no metadata and item is in view, get metadata!')
		// TODO use cache if available
		const sub = relay.subscribePool({
			authors: [pubKey],
			kinds: [EventKind.SetMetadata],
			// skipVerification: true
		})
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.SetMetadata) {
				// TODO use latest event
				setMetadata(parseProfileContent<IProfileContent>(e))
				// TODO save in cache
			}
		})

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visibleItems])

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.colWrap} onPress={handleContactPress}>
				<ProfilePic uri={metadata?.picture} />
				{metadata ?
					<View>
						<Username
							displayName={metadata.displayName}
							display_name={metadata.display_name}
							username={metadata.username}
							name={metadata.name}
							npub={truncateNpub(nip19.npubEncode(pubKey))}
							fontSize={16}
						/>
						{metadata.about?.length > 0 &&
							<Txt
								txt={truncateAbout(metadata.about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						}
					</View>
					:
					<Txt txt={truncateNpub(nip19.npubEncode(pubKey))} styles={[{ fontWeight: '500' }]} />
				}
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.sendEcashBtn, { backgroundColor: hi[highlight] }]}
				onPress={handleSend}
			>
				<Txt txt={t('send')} styles={[styles.sendTxt]} />
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sendEcashBtn: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 50,
	},
	sendTxt: {
		color: '#FAFAFA',
		fontWeight: '500'
	}
})