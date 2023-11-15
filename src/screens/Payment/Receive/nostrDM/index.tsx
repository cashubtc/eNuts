import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { getMintsUrls } from '@db'
import { l } from '@log'
import type { TNostrReceivePageProps } from '@model/nav'
import type { IContact, INostrDm } from '@model/nostr'
import { EventKind } from '@nostr/consts'
import { decrypt } from '@nostr/crypto'
import { parseProfileContent } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { pool } from '@src/nostr/class/Pool'
import { secureStore } from '@store'
import { SECRET } from '@store/consts'
import { getUnixTimestampFromDaysAgo, isCashuToken } from '@util'
import { Event as NostrEvent } from 'nostr-tools'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import NostrMessage from './NostrMessage'

const tokenMinLength = 25

export default function NostrDMScreen({ navigation, route }: TNostrReceivePageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { userRelays, claimedEvtIds, recent } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	// user mints is used in case user wants to send Ecash from the DMs screen
	const [userMints, setUserMints] = useState<string[]>([])
	const [dmProfiles, setDmProfiles] = useState<IContact[]>([])
	const [dms, setDms] = useState<INostrDm[]>([])
	const setDmsCB = useCallback((newDms: INostrDm[]) => setDms(newDms), [])

	// decrypt dm, check for uniq cashu token and set dms state
	const handleDm = (sk: string, e: NostrEvent) => {
		if (!sk.length) {
			l('can not handle dms, empy key!')
			return
		}
		if (claimedEvtIds[e.id]) { return }
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
				setDms(prev => [
					...prev,
					{
						created_at: e.created_at,
						sender: e.pubkey,
						msg: decrypted,
						token: word,
						id: e.id
					}
				])
			}
		}
	}

	// get dms for conversationsPubKeys from relays
	useEffect(() => {
		// TODO add an option for the user to choose how many days ago to check for dms
		const since = getUnixTimestampFromDaysAgo(14)
		void (async () => {
			startLoading()
			if (!recent.length) {
				stopLoading()
				return
			}
			const sk = await secureStore.get(SECRET)
			const sub = pool.subscribePool({
				filter: {
					relayUrls: userRelays,
					// TODO how to check incoming DMs from ppl you did not have a conversation with yet? (new dm request)
					authors: recent.map(x => x.hex),
					kinds: [EventKind.DirectMessage, EventKind.Metadata],
					since,
				}
			})
			sub?.on('event', (e: NostrEvent) => {
				if (+e.kind === EventKind.Metadata) {
					setDmProfiles(prev => prev.some(x => x.hex === e.pubkey) ? prev : [...prev, { hex: e.pubkey, ...parseProfileContent(e) }])
				}
				if (+e.kind === EventKind.DirectMessage) {
					handleDm(sk || '', e)
				}
			})
			sub?.on('eose', () => stopLoading())
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userRelays])

	useEffect(() => {
		void (async () => {
			const mints = await getMintsUrls()
			setUserMints(mints)
		})()
	}, [])

	return (
		<Screen
			screenName={t('receiveEcashNostr')}
			withBackBtn
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
									sender={dmProfiles.find(x => x.hex === dm.sender)}
									dms={dms}
									setDms={setDmsCB}
									mints={userMints}
									nav={{ navigation, route }}
								/>
							))
							:
							<Empty
								txt={t('clearOverHere')}
								hint={t('nostrDmHint')}
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