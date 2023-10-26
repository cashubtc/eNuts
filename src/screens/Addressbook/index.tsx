import Button, { TxtButton } from '@comps/Button'
import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import { QRIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import { getMintsBalances } from '@db'
import { l } from '@log'
import type { TAddressBookPageProps } from '@model/nav'
import type { IContact, IProfileContent, TUserRelays } from '@model/nostr'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { getNostrUsername, isHex, isNpub } from '@nostr/util'
import { useIsFocused } from '@react-navigation/native'
import { FlashList, type ViewToken } from '@shopify/flash-list'
import { useKeyboardCtx } from '@src/context/Keyboard'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { Nostr } from '@src/nostr/class/Nostr'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { getCustomMintNames } from '@store/mintStore'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { isNum, uniq, uniqByIContacts } from '@util'
import { Image } from 'expo-image'
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, StyleSheet, Text, type TextInput, TouchableOpacity, View } from 'react-native'

import ContactPreview from './ContactPreview'
import ProfilePic from './ProfilePic'
import SyncModal from './SyncModal'

/****************************************************************************/
/* State issues will occur while debugging Android and IOS at the same time */
/****************************************************************************/

const marginBottom = isIOS ? 100 : 75
const marginBottomPayment = isIOS ? 25 : 0

const loadCount = 20


function filterContactArr(arr: IContact[]) {
	return arr.filter(x => x && Object.keys(x).length > 1)
}
// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	// For FlastList
	const ref = createRef<FlashList<IContact>>()

	const { t } = useTranslation([NS.common])
	const isFocused = useIsFocused()
	const { isKeyboardOpen } = useKeyboardCtx()
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const {
		nutPub,
		setNutPub,
		pubKey,
		setPubKey,
		userProfile,
		setUserProfile,
		userRelays,
		setUserRelays,
		favs,
	} = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const inputRef = createRef<TextInput>()
	const nostrRef = useRef<Nostr>()
	const contactsRef = useRef<IContact[]>([])
	const recentsRef = useRef<IContact[]>([])
	const contactsListLenRef = useRef(0)
	// const [contactsList, setContactsList] = useState<string[]>([])
	const [contacts, setContacts] = useState<IContact[]>([])
	const [recents, setRecents] = useState<IContact[]>([])
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [newNpubModal, setNewNpubModal] = useState(false)
	const [showSearch, setShowSearch] = useState(false)
	// indicates if user has already fully synced his contacts previously
	const [hasFullySynced, setHasFullySynced] = useState(!!nostrRef.current?.isSync)
	// sync status
	const abortControllerRef = useRef<AbortController>()
	const [status, setStatus] = useState({ started: false, finished: false })
	const [syncModal, setSyncModal] = useState(false)
	const [progress, setProgress] = useState(0)
	const [doneCount, setDoneCount] = useState(0)
	const [contactsView, setContactsView] = useState({ startIdx: -1, endIdx: -1 })

	const next = useCallback(() => {
		requestAnimationFrame(_time => {
			if (nostrRef.current?.isSync) { return }
			void nostrRef.current?.setupMetadataSubMany({
				contactsView,
				hasArr: filterContactArr(
					contacts?.length ? contacts : contactsRef?.current ?? []
				),
				toDo: (() => {
					const itemsInView = uniq([
						...contacts
							?.map?.(x => x.hex)
							.slice(contactsView.startIdx, contactsView.endIdx + 1) ?? [],
						...contactsRef?.current
							?.map?.(x => x.hex)
							.slice(contactsView.startIdx, contactsView.endIdx + 1) ?? []
					])
					return itemsInView
					// const done = uniq([
					// 	...contacts
					// 		?.filter(x => x && Object.keys(x).length > 1)
					// 		?.map?.(x => x.hex) ?? [],
					// 	...contactsRef?.current
					// 		?.filter(x => x && Object.keys(x).length > 1)
					// 		?.map?.(x => x.hex) ?? [],
					// ])
					// return nostrRef.current?.getToDo(x => !done.includes(x) && !toExclude.includes(x)).slice(0, loadCount)
				})(),
				count: loadCount,
				sig: abortControllerRef?.current?.signal,
				emitOnProfileChanged: {
					emitAsap: false,
					emitOnEose: true
				},
				noCache: true,
				onEose: (done, authors) => {
					l('[onEose]', { done: done.length, authors: authors.length })
					if (done.length === authors.length) {
						// setHasFullySynced(true)
						return
					}
					if (done.length < 2) {
						// TODO Handle this case
						// maybe ?
						void next()
					}
				}
			})
		})
	}, [contacts, contactsView])

	useEffect(() => {
		l({ ...contactsView, len: contactsView.endIdx - contactsView.startIdx })
	}, [contactsView])

	const isSending = route.params?.isMelt || route.params?.isSendEcash
	const toggleSearch = useCallback(() => setShowSearch(prev => !prev), [])

	const sortFavs = useCallback((a: IContact, b: IContact) => {
		const aIsFav = favs.includes(a.hex)
		const bIsFav = favs.includes(b.hex)
		// a comes before b (a is a favorite)
		if (aIsFav && !bIsFav) { return -1 }
		// b comes before a (b is a favorite)
		if (!aIsFav && bIsFav) { return 1 }
		return 0
	}, [favs])

	// gets nostr data from cache or relay // TODO issue with image loading while scrolling fast
	const initContacts = useCallback(async (hex: string) => {
		stopLoading()
		l({ newHex: hex, refHex: nostrRef.current?.hex }, !nostrRef?.current?.hex || hex !== nostrRef.current.hex)
		// TODO issue with replacing npub
		if (!nostrRef?.current?.hex || hex !== nostrRef.current.hex) {
			nostrRef.current = new Nostr(hex, {
				onUserMetadataChanged: p => setUserProfile(p),
				onContactsChanged: allContacts => {
					setContacts(prev => {
						allContacts = allContacts?.filter(x => x !== hex)
						if (!allContacts?.length) { return prev }
						const old = contactsListLenRef.current > 0
						contactsListLenRef.current = allContacts.length
						if (!old) {
							l('call next')
							void next()
						}
						const x = uniqByIContacts([...prev, ...allContacts.map(x => ({ hex: x }))], 'hex')
						contactsRef.current = x
						l('contects  len', contactsRef.current.length)
						return x
					})
				},
				onProfileChanged: profiles => {
				// TODO profiles are always length 1
				// l({ profilesLengthInOnProfileChanged: profiles?.length })
				// if (!profiles?.length) { return }
				// setRecents(prev => {
				// 	const _profiles = profiles?.filter(c => recent.includes(c.hex))
				// 	if (!_profiles?.length || recent.length === recents.length) { return prev }
				// 	const x = uniqBy([...prev, ..._profiles], 'hex')
				// 	recentsRef.current = _profiles
				// 	return x
				// })
					l({ onProfileChangeEventProfiles: profiles?.length, should: contactsRef.current.length + (profiles?.length ?? 0) })
					setContacts(prev => {
						profiles = profiles?.filter(x => x?.hex !== hex)
						if (!profiles?.length) { return prev }
						const x = uniqByIContacts([...prev, ...profiles], 'hex')
						contactsRef.current = x
						l('contects  len', contactsRef.current.length)
						return x
					})
				},
				userRelays
			})
			await nostrRef.current.initUserData(userRelays)
			nostrRef.current.search('billigsteruser')
		}
	}, [next, setUserProfile, stopLoading, userRelays])

	const onViewableItemsChanged = useCallback((
		{ viewableItems }: { viewableItems: ViewToken[] }
	) => {
		const firstIdx = viewableItems?.[0]?.index
		if (!isNum(firstIdx) || firstIdx < 0) { return }
		setContactsView(prev => ({ ...prev, startIdx: firstIdx }))
		const endIdx = viewableItems?.[viewableItems.length - 1]?.index
		if (!isNum(endIdx) || endIdx < 0) { return }
		setContactsView(prev => ({ ...prev, endIdx }))
		l('### call next 3 ### ', { firstIdx, endIdx, len: contactsView.endIdx - contactsView.startIdx })
		void next()
		// l(contactsRef?.current?.length)
		// if (
		// 	!viewableItems?.length ||
		// 	viewableItems.length < 1
		// !contactsRef?.current?.length
		// ||contactsListLenRef.current === contactsRef?.current?.length
		// ) { return }
		// const viewableItemsCount = viewableItems.length
		// const renderedItemsCount = contactsRef?.current?.length
		// if (!viewableItemsCount || viewableItemsCount < 1) { return }
		// const idx = viewableItems[viewableItemsCount - 1].index ?? -1
		// if (idx >= renderedItemsCount - 1) {
		// if (MetadataRelay.activSubs /* || renderedItemsCount < loadCount */) { return }
		// 	l('call next 2 ### ', renderedItemsCount)
		// 	void next()
		// }
	}, [contactsView.endIdx, contactsView.startIdx, next])
	// useEffect(() => {
	// 	if (!NostrClassRef.current || !contactsListLen || contactsListLen < 1) { return }
	// 	    l('myUseEffect', {
	// 		firstIdx,
	// 		lastIdx,
	// 		contacts: contacts.length,
	// 		contactsListLen,
	// 		trigger: !(lastIdx < contacts.length - 2),
	// 		isRunning: NostrClassRef.current?.isRunning
	// 	})
	// 	if (contactsListLen > 0 && contacts.length < 1) {
	// 		l('call setupMetadataSubMany once')
	// 		return void NostrClassRef.current?.setupMetadataSubMany(contacts, 20)
	// 	}
	// 	if (lastIdx === -1 || lastIdx < contacts.length - 2 || NostrClassRef.current?.isRunning /**/) { return }
	// if (NostrClassRef.current?.isRunning) { return }
	// 	l('call setupMetadataSubMany ', contacts.length)
	// 	void NostrClassRef.current?.setupMetadataSubMany(contacts, 20)
	// }, [contacts, firstIdx, lastIdx, contactsListLen])

	// check if user has nostr data saved previously
	useEffect(() => {
		// l('isFocused', isFocused, pubKey.hex, NostrClassRef.current?.hex)
		if (!isFocused || pubKey.hex === nostrRef.current?.hex) { return }
		// startLoading()
		void (async () => {
			const [storedNPub, storedPubKeyHex, storedUserRelays, hasSynced] = await Promise.all([
				store.get(STORE_KEYS.npub),
				store.get(STORE_KEYS.npubHex),
				store.getObj<TUserRelays>(STORE_KEYS.relays),
				store.get(STORE_KEYS.synced)
			])
			// user has no nostr data yet
			if (!storedNPub || !storedPubKeyHex) {
				setNewNpubModal(true)
				stopLoading()
				return
			}
			// user has nostr data, set states
			setPubKey({ encoded: storedNPub || '', hex: storedPubKeyHex || '' })
			setUserRelays(storedUserRelays || [])
			setHasFullySynced(!!hasSynced)
			await initContacts(storedPubKeyHex)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFocused])

	const handleSync = async () => {
		if (!nostrRef.current) { return }
		abortControllerRef.current = new AbortController()
		setProgress(0)
		setDoneCount(0)
		setStatus(prev => ({ ...prev, started: true }))
		await nostrRef.current.setupMetadataSubAll({ sig: abortControllerRef.current.signal })
		//setContacts(Object.entries(result?.result || {}).map(([hex, profile]) => ({ hex, profile })))
		abortControllerRef.current = undefined
	}

	const handleCancel = () => {
		abortControllerRef.current?.abort()
		setStatus({ started: false, finished: true })
		setSyncModal(false)
	}

	const handleSearch = (text: string) => {
		if (!text) {
			setContacts(contactsRef.current)
			return
		}
		if (isNpub(text)) {
			setShowSearch(false)
			const hex = nip19.decode(text).data
			return handleSend(hex)
		}
		const filtered = contactsRef.current.filter(c => getNostrUsername(c).toLowerCase().includes(text.toLowerCase()))
		setContacts(filtered)
	}

	// handle npub input field
	const handleNpubInput = async () => {
		startLoading()
		setNewNpubModal(false)
		l('1')
		if (!pubKey.encoded && !pubKey.hex) {
			stopLoading()
			openPromptAutoClose({ msg: t('invalidPubKey') })
			return
		}
		l('2')
		let pub = { encoded: '', hex: '' }
		// check if is npub
		if (isNpub(pubKey.encoded)) {
			l('3')
			pub = { encoded: pubKey.encoded, hex: nip19.decode(pubKey.encoded).data || '' }
			l({ pub })
			setPubKey(pub)
			// start initialization of nostr data
			await handleNewNpub(pub)
			return
		}
		l('4')
		try {
			if (isHex(pubKey.hex)) {
				pub = { encoded: nip19.npubEncode(pubKey.hex), hex: pubKey.hex }
				setPubKey(pub)
			}
		} catch (e) {
			l('5')
			openPromptAutoClose({ msg: t('invalidPubKey') })
			stopLoading()
			return
		}
		l('6')
		// start initialization of nostr data
		await handleNewNpub(pub)
	}

	// handle new pasted npub and initialize nostr data
	const handleNewNpub = async (pub: { encoded: string, hex: string }) => {
		stopLoading()
		// generate new secret key
		const sk = generatePrivateKey() // `sk` is a hex string
		const pk = getPublicKey(sk)		// `pk` is a hex string
		setNutPub(pk)
		await Promise.allSettled([
			store.set(STORE_KEYS.npub, pub.encoded), 	// save nostr encoded pubKey
			store.set(STORE_KEYS.npubHex, pub.hex),		// save nostr hex pubKey
			store.set(STORE_KEYS.nutpub, pk),			// save enuts hex pubKey
			secureStore.set(SECRET, sk)					// save nostr secret generated by enuts for nostr DM interactions
		])
		await initContacts(pub.hex)
	}

	// user presses the send ecash button
	const handleSend = async (hex: string, contact?: IProfileContent) => {
		const nostr = {
			senderName: getNostrUsername(userProfile),
			receiverHex: hex,
			receiverName: getNostrUsername(contact),
			receiverBanner: contact?.banner,
			receiverPic: contact?.picture,
		}
		// melt to a contact zap address
		if (contact && route.params?.isMelt) {
			if (!route.params) { return }
			const { isMelt, mint, balance } = route.params
			if (!contact.lud16) {
				// melting target contact has no lnurl
				openPromptAutoClose({ msg: t('receiverNoLnurl', { ns: NS.addrBook }) })
				return
			}
			navigation.navigate('selectAmount', { isMelt, lnurl: contact.lud16, mint, balance })
			return
		}
		// mint has already been selected
		if (route.params?.mint) {
			navigation.navigate('selectNostrAmount', {
				mint: route.params.mint,
				balance: route.params.balance,
				nostr,
			})
			return
		}
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		if (nonEmptyMints.length === 1) {
			navigation.navigate('selectNostrAmount', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
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

	const handleRefresh = async () => {
		setIsRefreshing(true)
		setUserProfile(undefined)
		setContacts([])
		await Promise.allSettled([
			nostrRef?.current?.cleanCache(),
			Image.clearDiskCache(),
			store.delete(STORE_KEYS.synced)
		])
		nostrRef.current = undefined
		contactsListLenRef.current = -1
		setHasFullySynced(false)
		await initContacts(pubKey.hex)
		setIsRefreshing(false)
	}

	// auto-focus search input
	useEffect(() => {
		if (!showSearch) { return inputRef.current?.blur() }
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
		return () => clearTimeout(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showSearch])

	// l({ loading, nutPub, refLength: contactsRef.current.length })

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut') : t('addressBook', { ns: NS.topNav })}
				withBackBtn={isSending}
				nostrProfile={userProfile?.picture}
				showSearch={pubKey.hex.length > 0}
				toggleSearch={() => {
					// if contacts have been fully synced
					if (hasFullySynced || contactsRef.current.length === contactsListLenRef.current) {
						setContacts(contactsRef.current)
						return toggleSearch()
					}
					// ask for contacts sync to provide search functionality
					setSyncModal(true)
				}}
				handlePress={() => navigation.goBack()}
				openProfile={() => navigation.navigate('Contact', {
					contact: userProfile,
					hex: pubKey.hex,
					isUser: true
				})}
				loading={loading}
				noIcons
			/>
			<Text>
				{filterContactArr(contactsRef.current)?.length}/{contactsListLenRef.current} -
				{(filterContactArr(contactsRef.current)?.length * 100 / contactsListLenRef.current).toFixed(2)} %
			</Text>
			{loading || (nutPub && !contactsRef.current.length) ?
				<View style={styles.loadingWrap}><Loading /></View>
				:
				<>
					{/* user recently used */}
					{recentsRef.current.length > 0 &&
						<FlashList
							data={recents}
							horizontal
							estimatedItemSize={50}
							keyExtractor={item => item.hex}
						renderItem={({ item }) => (
								<TouchableOpacity onPress={() => void handleSend(item.hex, item)}>
									<ProfilePic
										hex={item.hex}
										size={50}
										uri={item.picture}
										overlayColor={color.INPUT_BG}
										isVerified={!!item.nip05?.length}
										isFav={favs.includes(item.hex)}
										// isInView={isInView(index)}
									/>
								</TouchableOpacity>
							)}
							contentContainerStyle={styles.recentList}
						/>
					}
					{showSearch &&
						<View style={{ paddingHorizontal: 20 }}>
							<TxtInput
								innerRef={inputRef}
								placeholder={t('searchContacts')}
								onChangeText={text => void handleSearch(text)}
								style={styles.searchInput}
							/>
						</View>
					}
					{/* user contacts */}
					{contactsRef.current.length > 0 ?
						<View style={[
							styles.contactsWrap,
							{ marginBottom: isKeyboardOpen || route.params?.isMelt || route.params?.isSendEcash ? marginBottomPayment : marginBottom }
						]}>
							<FlashList
								ref={ref}
								// fRef={ref}
								data={contacts}
								viewabilityConfig={{
									minimumViewTime: 500,
									waitForInteraction: true,
								}}
								estimatedItemSize={100}
								onViewableItemsChanged={onViewableItemsChanged}
								refreshControl={
									<RefreshControl
										refreshing={isRefreshing}
										onRefresh={() => void handleRefresh()}
										title={t('pullRefresh')}
										tintColor={hi[highlight]}
										titleColor={color.TEXT}
									/>
								}
								keyExtractor={item => item.hex}
								renderItem={({ item }) => (
									<ContactPreview
										contact={[item.hex, item]}
										openProfile={() => {
											navigation.navigate('Contact', {
												hex: item.hex,
												contact: item,
											})
										}}
										handleSend={() => void handleSend(item.hex, item)}
										isPayment={route.params?.isMelt || route.params?.isSendEcash}
										isFav={favs.includes(item.hex)}
										sortContacts={() => setContacts(prev => [...prev])}
										// isInView={isInView(index)}
									/>
								)}
								ListEmptyComponent={() => (
									<Empty
										txt={t('noResults', { ns: NS.addrBook })}
									/>
								)}
								ItemSeparatorComponent={() => (
									<Separator style={[styles.contactSeparator]} />
								)}
							/>
						</View>
						:
						<Empty
							txt={newNpubModal ? '' : t('addOwnNpub', { ns: NS.addrBook })}
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
					{t('addOwnNpub', { ns: NS.addrBook })}
				</Text>
				<View style={styles.wrap}>
					<TxtInput
						keyboardType='default'
						placeholder='NPUB/HEX'
						onChangeText={text => setPubKey(prev => ({ ...prev, encoded: text }))}
						value={pubKey.encoded}
						onSubmitEditing={() => void handleNpubInput()}
						style={[{ paddingRight: 60 }]}
					/>
					{/* scan icon */}
					<TouchableOpacity
						style={[styles.inputQR, { backgroundColor: color.INPUT_BG }]}
						onPress={() => {
							setNewNpubModal(false)
							const t = setTimeout(() => {
								navigation.navigate('qr scan', {})
								clearTimeout(t)
							}, 200)
						}}
					>
						<QRIcon color={hi[highlight]} />
					</TouchableOpacity>
				</View>
				<Button
					txt={t('submit')}
					onPress={() => {
						l('pressr')
						void handleNpubInput()
					}}
				/>
				<TxtButton
					txt={t('cancel')}
					onPress={() => setNewNpubModal(false)}
				/>
			</MyModal>
			<SyncModal
				visible={syncModal}
				close={() => setSyncModal(false)}
				status={status}
				handleSync={() => void handleSync()}
				handleCancel={handleCancel}
				progress={progress}
				contactsCount={contactsListLenRef.current}
				doneCount={doneCount}
			/>
			{!isKeyboardOpen && !route.params?.isMelt && !route.params?.isSendEcash &&
				<BottomNav navigation={navigation} route={route} />
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 100
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 100,
	},
	contactsWrap: {
		flex: 1,
	},
	contactSeparator: {
		marginHorizontal: 20,
		marginVertical: -10,
	},
	wrap: {
		position: 'relative',
		width: '100%'
	},
	inputQR: {
		position: 'absolute',
		right: 15,
		top: 22,
		paddingHorizontal: 10
	},
	searchInput: {
		marginVertical: 10,
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	recentList: {
		paddingTop: 10,
		paddingBottom: 20,
		paddingLeft: 20,
		paddingRight: 0,
	}
})
