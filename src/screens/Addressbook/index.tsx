import { TxtButton } from '@comps/Button'
import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import InputAndLabel from '@comps/InputAndLabel'
import Loading from '@comps/Loading'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import { isIOS } from '@consts'
import { getMintsBalances } from '@db'
import { l } from '@log'
import type { TAddressBookPageProps } from '@model/nav'
import type { IProfileContent, TUserRelays } from '@model/nostr'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { defaultRelays } from '@nostr/consts'
import { getNostrUsername } from '@nostr/util'
import { FlashList, type ViewToken } from '@shopify/flash-list'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { NostrData } from '@src/nostr/NostrData'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { getCustomMintNames } from '@store/mintStore'
import { globals } from '@styles'
import { getStrFromClipboard, openUrl } from '@util'
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import ContactPreview from './ContactPreview'
import UserProfile from './UserProfile'

/****************************************************************************/
/* State issues will occur while debugging Android and IOS at the same time */
/****************************************************************************/

const marginBottom = isIOS ? 100 : 75
const marginBottomPayment = isIOS ? 25 : 0

// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color } = useThemeContext()
	const {
		nutPub,
		setNutPub,
		pubKey,
		setPubKey,
		userProfile,
		setUserProfile,
		userRelays,
		setUserRelays,
		contacts,
		setContacts
	} = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const [, setAlreadySeen] = useState<string[]>([])
	const [newNpubModal, setNewNpubModal] = useState(false)
	const ref = useRef<NostrData>()
	const isSending = route.params?.isMelt || route.params?.isSendEcash

	// gets user data from cache or relay
	const initUserData = useCallback(({ hex, userRelays }: { hex: string, userRelays?: TUserRelays }) => {
		if (!hex || (userProfile && contacts.length)) {
			l('no pubKey or user data already available')
			stopLoading()
			return
		}
		if (!ref?.current?.hex || hex !== ref.current.hex) {
			ref.current = new NostrData(pubKey.hex, {
				onUserMetadataChanged: p => setUserProfile(p.profile),
				// onContactsChanged: (contacts => setContacts(contacts.),
				onProfilesChanged: contacts => setContacts(Object.entries(contacts).map(x => ([x[0], x[1].profile]))),
				userRelays
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Gets metadata from cache or relay for contact in viewport
	const setMetadata = useCallback((item: string) => {
		if (item[1]) { return }
		const hex = item[0]
		void ref?.current?.setupMetadataSub(hex)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// checks and saves already seen items to avoid multiple data fetch. Otherwise gets metadata from cache or relay
	const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		setAlreadySeen(prev => {
			for (let i = 0; i < viewableItems.length; i++) {
				const visible = viewableItems[i]
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const seen = prev.some(itemSeen => visible.item[0] === itemSeen)
				if (!seen) { void setMetadata(visible.item as string) }
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			return [...prev, ...viewableItems.map(v => v.item[0] as string)]
		})
	}, [setMetadata])

	// User is in payment process
	const handleMelt = (contact?: IProfileContent) => {
		if (!route.params) { return }
		const { isMelt, mint, balance } = route.params
		// user wants to melt to a contact address
		if (contact) {
			if (!contact.lud16) {
				// melting target contact has no lnurl
				openPromptAutoClose({ msg: 'Receiver has no LNURL' })
				return
			}
			navigation.navigate('selectAmount', { isMelt, lnurl: contact.lud16, mint, balance })
			return
		}
		// user wants to melt to his own lnurl
		if (!userProfile?.lud16) {
			openPromptAutoClose({ msg: t('FoundNoLnurl') })
			return
		}
		navigation.navigate('selectAmount', { isMelt, lnurl: userProfile?.lud16, mint, balance })
	}

	const handleEcash = (receiverNpub?: string, receiverName?: string) => {
		if (!route.params) { return }
		const { mint, balance, isSendEcash } = route.params
		navigation.navigate(
			'selectAmount',
			{
				mint,
				balance,
				isSendEcash,
				nostr: {
					senderName: getNostrUsername(userProfile),
					receiverNpub: (nip19.decode(receiverNpub || '').data || '') as string,
					receiverName,
				},
			}
		)
	}

	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		// clear input
		if (pubKey.encoded.length) {
			setPubKey({ encoded: '', hex: '' })
			return
		}
		startLoading()
		setNewNpubModal(false)
		// paste from clipboard
		const clipboard = await getStrFromClipboard()
		if (!clipboard) {
			stopLoading()
			return
		}
		let pub = { encoded: '', hex: '' }
		// check if is npub
		if (clipboard.startsWith('npub')) {
			pub = { encoded: clipboard, hex: nip19.decode(clipboard).data as string || '' }
			setPubKey(pub)
			await handleNewNpub(pub)
			return
		}
		try {
			const encoded = nip19.npubEncode(clipboard)
			pub = { encoded, hex: clipboard }
			setPubKey(pub)
		} catch (e) {
			openPromptAutoClose({ msg: t('invalidPubKey') })
			stopLoading()
			return
		}
		// close modal
		await handleNewNpub(pub)
	}

	const handleNewNpub = async (pub: { encoded: string, hex: string }) => {
		// generate new secret key
		const sk = generatePrivateKey() // `sk` is a hex string
		const pk = getPublicKey(sk)		// `pk` is a hex string
		setNutPub(pk)
		await Promise.all([
			store.set(STORE_KEYS.npub, pub.encoded), // save nostr encoded pubKey
			store.set(STORE_KEYS.npubHex, pub.hex),	// save nostr hex pubKey
			store.set(STORE_KEYS.nutpub, pk),			// save enuts hex pubKey
			secureStore.set(SECRET, sk)					// save nostr secret generated by enuts for nostr DM interactions
		])
		initUserData({ hex: pub.hex })
	}

	const handleContactPress = ({ contact, npub, isUser }: { contact?: IProfileContent, npub?: string, isUser?: boolean }) => {
		// add new npub
		if (!pubKey.encoded || !contacts.length) {
			setNewNpubModal(true)
			return
		}
		// navigate to contact screen
		if (contact && !isUser && !route.params?.isSendEcash && !route.params?.isMelt) {
			navigation.navigate('Contact', {
				contact,
				npub: npub || '',
				isUser,
				userProfile
			})
			return
		}
		// user is in payment process
		// user wants to melt
		if (route.params?.isMelt) {
			handleMelt(contact)
			return
		}
		// user wants to send ecash
		if (!isUser && route.params?.isSendEcash) {
			handleEcash(npub, getNostrUsername(contact))
			return
		}
		if (!userProfile) { return }
		// navigate to user profile
		navigation.navigate('Contact', {
			contact: userProfile,
			npub: pubKey.encoded,
			isUser
		})
	}

	// start sending ecash via nostr or melting to a LNURL from a nostr contact
	const handleSend = async ({ npub, name }: { npub: string, name?: string }) => {
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		const nostr = {
			senderName: getNostrUsername(userProfile),
			receiverNpub: npub,
			receiverName: name,
		}
		// TODO this could potentially written in shorter form
		if (nonEmptyMints.length === 1) {
			navigation.navigate('selectAmount', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				isSendEcash: true,
				balance: nonEmptyMints[0].amount,
				nostr,
			})
			return
		}
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal,
			allMintsEmpty: !nonEmptyMints.length,
			isSendEcash: true,
			nostr,
		})
	}

	// check if user has nostr data saved previously
	useEffect(() => {
		if (!ref?.current) {
			ref.current = new NostrData(pubKey.hex, {
				onUserMetadataChanged: p => setUserProfile(p.profile),
				// onContactsChanged: (contacts => setContacts(contacts.), 
				onProfilesChanged: contacts => setContacts(Object.entries(contacts).map(x => ([x[0], x[1].profile]))),
				userRelays
			})
		}
		void (async () => {
			startLoading()
			const data = await Promise.all([
				store.get(STORE_KEYS.npub),
				store.get(STORE_KEYS.npubHex),
				store.getObj<TUserRelays>(STORE_KEYS.relays),
			])
			if (!data?.[1]) {return}

			setPubKey({ encoded: data[0] || '', hex: data[1] || '' })
			setUserRelays(data[2] || [])
			initUserData({ hex: data[1] || '', userRelays: data[2] || [] })
			if (!data[0]) { setNewNpubModal(true) }
			stopLoading()
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut') : t('addressBook', { ns: NS.topNav })}
				withBackBtn={isSending}
				handlePress={() => isSending ? navigation.goBack() : navigation.navigate('qr scan', {})}
			/>
			{/* Header */}
			<View style={styles.bookHeader}>
				<ContactsCount />
			</View>
			{loading ?
				<View style={styles.loadingWrap}>
					<Loading />
				</View>
				:
				<>
					{/* user own profile */}
					{nutPub && userProfile && <UserProfile handlePress={handleContactPress} />}
					{/* user contacts */}
					{contacts.length > 0 ?
						<View style={[
							globals(color).wrapContainer,
							styles.contactsWrap,
							{ marginBottom: route.params?.isMelt || route.params?.isSendEcash ? marginBottomPayment : marginBottom }
						]}>
							<FlashList
								data={contacts}
								estimatedItemSize={300}
								viewabilityConfig={{
									minimumViewTime: 250,
									itemVisiblePercentThreshold: 10,
								}}
								onViewableItemsChanged={onViewableItemsChanged}
								keyExtractor={item => item[0]}
								renderItem={({ item, index }) => (
									<ContactPreview
										contact={item}
										handleContactPress={() => handleContactPress({ contact: item[1], npub: nip19.npubEncode(item[0]) })}
										handleSend={() => {
											void handleSend({
												npub: item[0],
												name: getNostrUsername(item[1])
											})
										}}
										isFirst={index === 0}
										isLast={index === contacts.length - 1}
										isPayment={route.params?.isMelt || route.params?.isSendEcash}
									/>
								)}
								ItemSeparatorComponent={() => <Separator style={[styles.contactSeparator]} />}
							/>
						</View>
						:
						<Empty
							txt={newNpubModal ? '' : t('addOwnLnurl', { ns: NS.addrBook })}
							pressable={!newNpubModal}
							onPress={() => setNewNpubModal(true)}
						/>
					}
				</>
			}
			{/* Add user npub modal */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={newNpubModal}
				close={() => setNewNpubModal(false)}
			>
				<Text style={globals(color).modalHeader}>
					{t('addOwnLnurl', { ns: NS.addrBook })}
				</Text>
				<InputAndLabel
					placeholder='NPUB/HEX'
					setInput={text => setPubKey(prev => ({ ...prev, encoded: text }))}
					value={pubKey.encoded}
					handleLabel={() => void handleInputLabelPress()}
					isEmptyInput={pubKey.encoded.length < 1}
				/>
				<TxtButton
					txt={t('whatsNostr')}
					onPress={() => void openUrl('https://nostr-resources.com/')}
					txtColor={color.TEXT}
					style={[{ paddingTop: 25 }]}
				/>
				<TxtButton
					txt={t('cancel')}
					onPress={() => setNewNpubModal(false)}
					style={[{ paddingTop: 25, paddingBottom: 10, }]}
				/>
			</MyModal>
			{!route.params?.isMelt && !route.params?.isSendEcash && <BottomNav navigation={navigation} route={route} />}
		</View>
	)
}

function ContactsCount() {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { contacts, userRelays } = useNostrContext()
	return (
		<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
			{!contacts.length ?
				''
				:
				`${contacts.length > 1 ? t('contact_other', { count: contacts.length }) : t('contact_one', { count: contacts.length })} - ${userRelays.length || defaultRelays.length} Relays`
			}
		</Text>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 100,
	},
	bookHeader: {
		paddingHorizontal: 20,
		marginBottom: 20,
		marginTop: 100,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
	},
	cancel: {
		marginTop: 25,
		marginBottom: 10
	},
	contactsWrap: {
		flex: 1,
		paddingHorizontal: 0,
	},
	contactSeparator: {
		marginLeft: 60,
		marginVertical: 10,
		marginRight: 20,
	},
})
