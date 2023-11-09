import { TxtButton } from '@comps/Button'
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
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore } from '@store'
import { SECRET } from '@store/consts'
import { getNostrDmUsers } from '@store/nostrDms'
import { hasEventId, isCashuToken } from '@util'
import { Event as NostrEvent } from 'nostr-tools'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import NostrMessage from './NostrMessage'

export default function NostrDMScreen({ navigation, route }: TNostrReceivePageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [isCancel, setIsCancel] = useState(false)
	const { userRelays, claimedEvtIds } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	// user mints is used in case user wants to send Ecash from the DMs screen
	const [userMints, setUserMints] = useState<string[]>([])
	const [dmProfiles, setDmProfiles] = useState<TContact[]>([])
	const [dms, setDms] = useState<INostrDm[]>([])
	const setDmsCB = useCallback((newDms: INostrDm[]) => setDms(newDms), [])

	// decrypt dm, check for uniq cashu token and set dms state
	const handleDm = (sk: string, e: NostrEvent) => {
		if (!sk.length) {
			l('can not handle dms, empy key!')
			return
		}
		const tokenMinLength = 25
		// decrypt content
		const decrypted = decrypt(sk, e.pubkey, e.content)
		// remove newlines (can be attached to the cashu token) and create an array of words
		const words = decrypted.replace(/\n/g, ' ').split(' ')
		// check each word of content
		for (let i = 0; i < words.length; i++) {
			const word = words[i]
			if (!word || word.length < tokenMinLength) { continue }
			// set dm state
			if (isCashuToken(word)) {
				// dont set state if already claimed OR same created_at OR same token
				setDms(prev => prev.some(entry => hasEventId(claimedEvtIds, entry.id) || entry.created_at === e.created_at || entry.token === word) ?
					[...prev]
					:
					[...prev, { created_at: e.created_at, sender: e.pubkey, msg: decrypted, token: word, id: e.id }]
				)
			}
		}
	}

	const handleCancel = () => setIsCancel(true)

	// get dms for conversationsPubKeys from relays
	useEffect(() => {
		void (async () => {
			startLoading()
			const conversationsPubKeys = await getNostrDmUsers()
			if (!conversationsPubKeys.length) {
				stopLoading()
				return
			}
			const sk = await secureStore.get(SECRET)
			const sub = relay.subscribePool({
				relayUrls: userRelays,
				// TODO how to check incoming DMs from ppl you did not have a conversation with yet? (new dm request)
				authors: conversationsPubKeys, // ['69a80567e79b6b9bc7282ad595512df0b804784616bedb623c122fad420a2635']
				kinds: [EventKind.DirectMessage, EventKind.SetMetadata],
				skipVerification: Config.skipVerification
			})
			sub?.on('event', (e: NostrEvent) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				if (+e.kind === EventKind.SetMetadata) {
					setDmProfiles(prev => prev.some(x => x[0] === e.pubkey) ? prev : [...prev, [e.pubkey, parseProfileContent(e)]])
				}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				if (+e.kind === EventKind.DirectMessage) {
					handleDm(sk || '', e)
				}
			})
			sub?.on('eose', () => {
				stopLoading()
				setIsCancel(false)
			})
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userRelays])

	// handle cancel
	useEffect(() => {
		if (!isCancel) { return }
		relay.closePoolConnection(userRelays)
		navigation.navigate('dashboard')
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isCancel])

	useEffect(() => {
		void (async () => {
			const mints = await getMintsUrls()
			setUserMints(mints)
		})()
	}, [])

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
					<Txt
						txt={t('invoiceHint', { ns: NS.mints })}
						styles={[{ color: color.TEXT_SECONDARY }, styles.hint]}
					/>
					<TxtButton
						txt={t('cancel')}
						onPress={handleCancel}
						style={[{ paddingTop: 20, paddingBottom: 10 }]}
					/>
				</View>
				:
				<View>
					{dms.length > 0 &&
						<Txt
							txt={t('totalDmsReceived', { totalDms: dms.length })}
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
							<Empty
								txt={t('clearOverHere')}
								hasOk
								nav={navigation}
							/>
						}
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
		marginBottom: 10,
		textAlign: 'center',
	},
	hint: {
		fontSize: 14,
		marginBottom: 20
	}
})