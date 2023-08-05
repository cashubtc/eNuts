import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TNostrReceivePageProps } from '@model/nav'
import { relay } from '@nostr/class/Relay'
import { EventKind } from '@nostr/consts'
import { decrypt } from '@nostr/crypto'
import Config from '@src/config'
import { NostrContext } from '@src/context/Nostr'
import { secureStore } from '@store'
import { SECRET } from '@store/consts'
import { isCashuToken } from '@util'
import { Event as NostrEvent } from 'nostr-tools'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

interface INostrDm {
	created_at: number
	sender: string
	msg: string
}

export default function NostrDMScreen({ navigation }: TNostrReceivePageProps) {
	const { t } = useTranslation(['common'])
	const { userRelays } = useContext(NostrContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const [dms, setDms] = useState<INostrDm[]>([])

	const handleDm = async (sk: string, e: NostrEvent) => {
		if (!sk.length) {
			l('can not handle dms, empy key!')
			return
		}
		const tokenMinLength = 25
		// decrypt content
		const decrypted = await decrypt(sk, e.pubkey, e.content)
		const words = decrypted.split(' ')
		// check each word of content
		for (let i = 0; i < words.length; i++) {
			const word = words[i]
			if (!word || word.length < tokenMinLength) { continue }
			// set dm state
			if (isCashuToken(word)) {
				setDms(prev => {
					// avoid adding same token event
					if (prev.some(entry => entry.created_at === e.created_at)) {
						return prev
					}
					return [...prev, { created_at: e.created_at, sender: e.pubkey, msg: word }]
				})
			}
		}
	}

	useEffect(() => {
		void (async () => {
			startLoading()
			const sk = await secureStore.get(SECRET)
			const sub = relay.subscribePool({
				relayUrls: userRelays,
				// TODO how to proper check new DMs without checking each contact and
				// also how to check incoming DMs from ppl you dont have in your contact list.
				authors: ['69a80567e79b6b9bc7282ad595512df0b804784616bedb623c122fad420a2635'],
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
				dms.length ?
					dms.map(dm => (
						<Text key={dm.created_at}>
							{dm.msg}
						</Text>
					))
					:
					<>
					</>
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
	loadingtxt: {
		marginTop: 20,
		textAlign: 'center',
	},
})