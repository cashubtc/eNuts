import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import { l } from '@log'
import type { TAddressBookPageProps } from '@model/nav'
import type { IProfileContent, TContact, TUserRelays } from '@model/nostr'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { relay } from '@nostr/class/Relay'
import { defaultRelays, EventKind, npubLength } from '@nostr/consts'
import { filterFollows, parseProfileContent, parseUserRelays } from '@nostr/util'
import { FlashList, type ViewToken } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { isStr } from '@util'
import * as Clipboard from 'expo-clipboard'
import { type Event as NostrEvent, generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import ContactPreview from './ContactPreview'
import ProfilePic from './ProfilePic'
import Username from './Username'

export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [pubKey, setPubKey] = useState({ encoded: '', hex: '' })
	const [userProfile, setUserProfile] = useState<IProfileContent | undefined>()
	const [userRelays, setUserRelays] = useState<TUserRelays>([])
	const [contacts, setContacts] = useState<TContact[]>([])
	const [, setAlreadySeen] = useState<string[]>([])
	const [newNpubModal, setNewNpubModal] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()

	// gets user data from cache or relay
	const initUserData = useCallback(({ pubKey, userRelays }: { pubKey?: string, userRelays?: TUserRelays }) => {
		if (!pubKey || (userProfile && contacts.length)) {
			l('no pubKey or user data already available')
			return
		}
		l({ userRelays })
		// TODO use cache if available
		const sub = relay.subscribePool({
			relayUrls: userRelays,
			authors: [pubKey],
			kinds: [EventKind.SetMetadata, EventKind.ContactList],
			skipVerification: true // debug
		})
		let latestRelays = 0 	// createdAt
		let latestContacts = 0 	// createdAt
		sub?.on('event', async (e: NostrEvent) => {
			if (+e.kind === EventKind.SetMetadata) {
				// TODO save user metadata in cache
				setUserProfile(parseProfileContent(e))
			}
			if (+e.kind === EventKind.ContactList) {
				// save user relays
				if (!userRelays && e.created_at > latestRelays) {
					// TODO user relays should be updated (every day?)
					const relays = parseUserRelays<TUserRelays>(e.content)
					latestRelays = e.created_at
					await store.setObj(STORE_KEYS.relays, relays)
				}
				if (e.created_at > latestContacts) {
					l('new contact event')
					// TODO save contacts in cache
					latestContacts = e.created_at
					setContacts(prev => (filterFollows(e.tags).map(f => [f, prev[1]])) as unknown as TContact[])
				}
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Gets metadata from cache or relay for contact in viewport
	const setMetadata = useCallback((item: string) => {
		const hex = item[0]
		// TODO use cache if available
		const sub = relay.subscribePool({
			relayUrls: userRelays,
			authors: [hex],
			kinds: [EventKind.SetMetadata],
			skipVerification: true // debug
		})
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.SetMetadata) {
				// TODO save contacts in cache
				setContacts(prev => prev.map(c => c[0] === hex ? [c[0], parseProfileContent<IProfileContent>(e)] : c))
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// checks and saves already seen items to avoid multiple data fetch. Otherwise gets metadata from cache or relay
	const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		setAlreadySeen(prev => {
			for (let i = 0; i < viewableItems.length; i++) {
				const visible = viewableItems[i]
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const seen = prev.some(itemSeen => visible.item[0] === itemSeen)
				if (!seen) { setMetadata(visible.item as string) }
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			return [...prev, ...viewableItems.map(v => v.item[0] as string)]
		})
	}, [setMetadata])

	// User is in melting process
	const handleMelt = () => {
		if (!route.params) { return }
		const { isMelt, mint, balance } = route.params
		const userLn = userProfile?.lud16 || userProfile?.lud06
		if (!userLn) {
			openPromptAutoClose({ msg: 'no ln TODO: translate' })
			return
		}
		navigation.navigate('selectAmount', { isMelt, lnurl: userLn, mint, balance })
	}

	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		// clear input
		if (pubKey.encoded.length > 0) {
			setPubKey({ encoded: '', hex: '' })
			return
		}
		// paste from clipboard
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		setPubKey({ encoded: clipboard, hex: '' })
	}

	// save npub pasted by user
	const handleNewNpub = async () => {
		if (!pubKey.encoded.length || !pubKey.encoded.startsWith('npub')) {
			// TODO translate
			openPromptAutoClose({ msg: 'Invalid NPUB!' })
			return
		}
		const hex = nip19.decode(pubKey.encoded).data
		if (!isStr(hex) || hex.length !== npubLength) {
			// TODO translate
			openPromptAutoClose({ msg: 'Something went wrong while decoding your NPUB!' })
			return
		}
		// generate new nsec
		const sk = generatePrivateKey() // `sk` is a hex string
		l('sk generated')
		const pk = getPublicKey(sk) 	// `pk` is a hex string
		await Promise.all([
			store.set(STORE_KEYS.npub, pubKey.encoded), // save nostr encoded pubKey
			store.set(STORE_KEYS.npubHex, hex),			// save nostr hex pubKey
			store.set(STORE_KEYS.nutpub, pk),			// save enuts hex pubKey
			secureStore.set(SECRET, sk)					// save nostr secret generated by enuts for nostr DM interactions
		])
		setPubKey(prev => ({ ...prev, hex }))
		// close modal
		setNewNpubModal(false)
		initUserData({ pubKey: hex })
	}

	// opens profile screen
	const handleContactPress = (isUser?: boolean) => {
		if (!isUser) {
			// TODO show contact profile
			l('contact press')
			return
		}
		// add new npub
		if (!pubKey.encoded) {
			setNewNpubModal(true)
			return
		}
		// user wants to melt
		if (route.params?.isMelt) {
			handleMelt()
			return
		}
		// navigate to user profile
		if (!userProfile) { return }
		navigation.navigate('Contact', {
			contact: userProfile,
			npub: pubKey.encoded,
			isUser
		})
	}

	// check if user has nostr data saved previously
	useEffect(() => {
		void (async () => {
			const data = await Promise.all([
				store.get(STORE_KEYS.npub),
				store.get(STORE_KEYS.npubHex),
				store.getObj<TUserRelays>(STORE_KEYS.relays),
			])
			setPubKey({ encoded: data[0] || '', hex: data[1] || '' })
			l('user relays in store: ', data[2])
			setUserRelays(data[2] || [])
			initUserData({ pubKey: data[1] || '', userRelays: data[2] || [] })
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut', { ns: 'common' }) : t('addressBook', { ns: 'topNav' })}
				withBackBtn={route.params?.isMelt}
				handlePress={() => navigation.goBack()}
			/>
			{/* Header */}
			<View style={styles.bookHeader}>
				<ContactsCount count={contacts.length} relaysCount={userRelays.length} />
			</View>
			{/* user own profile */}
			<TouchableOpacity
				style={[globals(color).wrapContainer, styles.bookEntry, styles.userEntryContainer]}
				onPress={() => handleContactPress(true)}
			>
				<View style={styles.picNameWrap}>
					<ProfilePic uri={userProfile?.picture} withPlusIcon={!pubKey.hex} isUser />
					{pubKey.hex.length ?
						<Username displayName={userProfile?.displayName} username={userProfile?.username} npub={pubKey.encoded} />
						:
						<Txt txt={t('addOwnLnurl', { ns: 'addrBook' })} styles={[{ color: hi[highlight] }]} />
					}
				</View>
				{userProfile ?
					<ChevronRightIcon color={color.TEXT} />
					:
					<View />
				}
			</TouchableOpacity>
			{/* user contacts */}
			{contacts.length > 0 &&
				<View style={[globals(color).wrapContainer, styles.contactsWrap]}>
					<FlashList
						data={contacts}
						estimatedItemSize={300}
						viewabilityConfig={{
							minimumViewTime: 500,
							itemVisiblePercentThreshold: 60,
						}}
						onViewableItemsChanged={onViewableItemsChanged}
						renderItem={({ item }) => (
							<ContactPreview
								contact={item}
								handleContactPress={() => handleContactPress()}
							/>
						)}
						ItemSeparatorComponent={() => <Separator style={[styles.contactSeparator]} />}
					/>
				</View>
			}
			{/* Add user npub modal */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={newNpubModal}
				close={() => setNewNpubModal(false)}
			>
				<Text style={globals(color).modalHeader}>
					{t('yourProfile', { ns: 'addrBook' })}
				</Text>
				<View style={{ position: 'relative', width: '100%' }}>
					<TxtInput
						placeholder='NPUB'
						onChangeText={text => setPubKey(prev => ({ ...prev, encoded: text }))}
						value={pubKey.encoded}
						onSubmitEditing={() => void handleNewNpub()}
					/>
					{/* Paste / Clear Input */}
					<TouchableOpacity
						style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
						onPress={() => void handleInputLabelPress()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{!pubKey.encoded.length ? t('paste') : t('clear')}
						</Text>
					</TouchableOpacity>
				</View>
				<Button
					txt={t('save')}
					onPress={() => void handleNewNpub()}
				/>
				<TouchableOpacity
					style={styles.cancel}
					onPress={() => setNewNpubModal(false)}
				>
					<Text style={globals(color, highlight).pressTxt}>
						{t('cancel')}
					</Text>
				</TouchableOpacity>
			</MyModal>
			{!route.params?.isMelt && <BottomNav navigation={navigation} route={route} />}
			{prompt.open && <Toaster txt={prompt.msg} />}
		</View>
	)
}

function ContactsCount({ count, relaysCount }: { count: number, relaysCount?: number }) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
			{!count ?
				''
				:
				`${count > 1 ? t('contact_other', { count }) : t('contact_one', { count })} - ${relaysCount || defaultRelays.length} Relays`
			}
		</Text>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0
	},
	bookHeader: {
		paddingHorizontal: 20,
		marginBottom: 20,
		marginTop: 100,
	},
	userEntryContainer: {
		paddingVertical: 9,
		marginBottom: 25,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
	},
	bookEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginVertical: 8,
	},
	cancel: {
		marginTop: 25,
		marginBottom: 10
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
	contactsWrap: {
		flex: 1,
		paddingVertical: 20,
		marginBottom: isIOS ? 70 : 50
	},
	contactSeparator: {
		marginLeft: 60,
		marginVertical: 10,
	},
	picNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})
