import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { getMintsUrls } from '@db'
import { l } from '@log'
import type { TNostrReceivePageProps } from '@model/nav'
import type { INostrDm, TContact } from '@model/nostr'
import { relay } from '@nostr/class/Relay'
import { EventKind } from '@nostr/consts'
import { decrypt } from '@nostr/crypto'
import { parseProfileContent } from '@nostr/util'
import Config from '@src/config'
import { useNostrContext } from '@src/context/Nostr'
import { secureStore } from '@store'
import { SECRET } from '@store/consts'
import { hasEventId, isCashuToken } from '@util'
import { Event as NostrEvent } from 'nostr-tools'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import NostrMessage from './NostrMessage'

export default function NostrDMScreen({ navigation, route }: TNostrReceivePageProps) {
	const { t } = useTranslation(['common'])
	const { userRelays, claimedEvtIds } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const [userMints, setUserMints] = useState<string[]>([])
	const [dmProfiles, setDmProfiles] = useState<TContact[]>([])
	const [dms, setDms] = useState<INostrDm[]>([])
	const setDmsCB = useCallback((newDms: INostrDm[]) => setDms(newDms), [])

	// decrypt dm, check for uniq cashu token and set dms state
	const handleDm = async (sk: string, e: NostrEvent) => {
		if (!sk.length) {
			l('can not handle dms, empy key!')
			return
		}
		const tokenMinLength = 25
		// decrypt content
		const decrypted = await decrypt(sk, e.pubkey, e.content)
		// remove newlines (can be attached to the cashu token) and create an array of words
		const words = decrypted.replace(/\n/g, ' ').split(' ')
		// check each word of content
		for (let i = 0; i < words.length; i++) {
			const word = words[i]
			if (!word || word.length < tokenMinLength) { continue }
			// set dm state
			if (isCashuToken(word)) {
				l({ claimedEvtIds })
				// dont set state if already claimed OR same created_at OR same token
				setDms(prev => prev.some(entry => hasEventId(claimedEvtIds, entry.id) || entry.created_at === e.created_at || entry.token === word) ?
					[...prev]
					:
					[...prev, { created_at: e.created_at, sender: e.pubkey, msg: decrypted, token: word, id: e.id }]
				)
			}
		}
	}

	useEffect(() => {
		void (async () => {
			const mints = await getMintsUrls()
			setUserMints(mints)
		})()
	}, [])

	// get dms for conversationsPubKeys from relays
	useEffect(() => {
		void (async () => {
			startLoading()
			const sk = await secureStore.get(SECRET)
			// const conversationsPubKeys = await getNostrDmUsers()
			const sub = relay.subscribePool({
				relayUrls: userRelays,
				// TODO how to check incoming DMs from ppl you did not have a conversation with yet? (new dm request)
				authors: ['69a80567e79b6b9bc7282ad595512df0b804784616bedb623c122fad420a2635'], //  conversationsPubKeys
				kinds: [EventKind.DirectMessage, EventKind.SetMetadata],
				skipVerification: Config.skipVerification
			})
			sub?.on('event', async (e: NostrEvent) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				if (+e.kind === EventKind.SetMetadata) {
					setDmProfiles(prev => prev.some(x => x[0] === e.pubkey) ? prev : [...prev, [e.pubkey, parseProfileContent(e)]])
				}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				if (+e.kind === EventKind.DirectMessage) {
					await handleDm(sk || '', e)
				}
			})
			sub?.on('eose', () => stopLoading())
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userRelays])

	return (
		<Screen
			screenName={t('receiveEcashNostr')}
			withCancelBtn
			handlePress={() => navigation.navigate('dashboard')}
		>
			{/* checking DMs */}
			{loading ?
				<View style={styles.loadingContainer}>
					<Loading nostr />
					<Txt
						txt={t('checkingDms')}
						styles={[styles.loadingtxt]}
					/>
				</View>
				:
				<View>
					{dms.length > 0 &&
						<Txt
							txt={`You received ${dms.length} Cashu token.`}
							styles={[styles.heading]}
						/>
					}
					<ScrollView style={{ marginBottom: isIOS ? 30 : 0 }}>
						{dms.length ?
							dms.map(dm => (
								<NostrMessage
									key={dm.id}
									msgEntry={dm}
									sender={dmProfiles.find(x => x[0] === dm.sender)}
									dms={dms}
									setDms={setDmsCB}
									mints={userMints}
									nav={{ navigation, route }}
								/>
							))
							:
							<Empty txt='Found no Ecash in your DMs...' />}
					</ScrollView>
				</View>
			}
		</Screen>
	)
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 100,
	},
	heading: {
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	loadingtxt: {
		marginTop: 20,
		textAlign: 'center',
	},
})