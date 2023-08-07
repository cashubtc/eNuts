import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { getMintsUrls } from '@db'
import { l } from '@log'
import type { TNostrReceivePageProps } from '@model/nav'
import type { INostrDm } from '@model/nostr'
import { relay } from '@nostr/class/Relay'
import { EventKind } from '@nostr/consts'
import { decrypt } from '@nostr/crypto'
import Config from '@src/config'
import { NostrContext } from '@src/context/Nostr'
import { secureStore } from '@store'
import { SECRET } from '@store/consts'
import { isCashuToken } from '@util'
import { Event as NostrEvent } from 'nostr-tools'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import NostrMessage from './NostrMessage'

export default function NostrDMScreen({ navigation }: TNostrReceivePageProps) {
	const { t } = useTranslation(['common'])
	const { userRelays, claimedEvtIds } = useContext(NostrContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const [userMints, setUserMints] = useState<string[]>([])
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
				setDms(prev => prev.some(entry => claimedEvtIds.includes(entry.id) || entry.created_at === e.created_at || entry.token === word) ?
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
				kinds: [EventKind.DirectMessage],
				skipVerification: Config.skipVerification
			})
			sub?.on('event', async (e: NostrEvent) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				if (+e.kind === EventKind.DirectMessage) {
					await handleDm(sk || '', e)
				}
			})
			sub?.on('eose', () => stopLoading())
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userRelays])

	// TODO check already spent tokens from trusted mints and filter them out
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
							dms.map(dm => <NostrMessage key={dm.id} msgEntry={dm} dms={dms} setDms={setDmsCB} mints={userMints} />)
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