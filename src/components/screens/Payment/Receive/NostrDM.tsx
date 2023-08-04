import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TNostrReceivePageProps } from '@model/nav'
import { relay } from '@nostr/class/Relay'
import { EventKind } from '@nostr/consts'
import { NostrContext } from '@src/context/Nostr'
import { Event as NostrEvent } from 'nostr-tools'
import { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function NostrDMScreen({ navigation }: TNostrReceivePageProps) {
	const { t } = useTranslation(['common'])
	const { pubKey, userRelays } = useContext(NostrContext)
	const { loading, startLoading, stopLoading } = useLoading()

	useEffect(() => {
		startLoading()
		const sub = relay.subscribePool({
			relayUrls: userRelays,
			authors: [pubKey.hex],
			kinds: [EventKind.SetMetadata, EventKind.ContactList], // EventKind.DirectMessage
			skipVerification: true // debug
		})
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.DirectMessage) {
				l({ DM: e.content })
			}
		})
		sub?.on('eose', () => {
			stopLoading()
		})

	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pubKey, userRelays])

	return (
		<Screen
			screenName={t('receiveEcashNostr')}
			withCancelBtn
			handlePress={() => navigation.navigate('dashboard')}
		>
			{loading ?
				<View style={styles.loadingContainer}>
					<Loading nostr />
					<Txt
						txt={t('checkingDms')}
						styles={[styles.loadingtxt]}
					/>
				</View>
				:
				<></>
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