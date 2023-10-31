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
import { FlashList } from '@shopify/flash-list'
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
import { debounce, isNum } from '@util'
import { Image } from 'expo-image'
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, StyleSheet, Text, type TextInput, TouchableOpacity, View } from 'react-native'

import ContactPreview from './ContactPreview'
import ProfilePic from './ProfilePic'
// import SyncModal from './SyncModal'

/****************************************************************************/
/* State issues will occur while debugging Android and IOS at the same time */
/****************************************************************************/

interface CustomViewToken {
	item: IContact // Replace YourTypeHere with the actual type you want
	key: string
	index: number | null
	isViewable: boolean
	timestamp: number
}

interface IShouldCallNext {
	shouldCall: boolean
	todo: string[]
}

interface IViewableItems { viewableItems: CustomViewToken[] }

const marginBottom = isIOS ? 100 : 75
const marginBottomPayment = isIOS ? 25 : 0

function filterContactArr(arr: IContact[]) {
	return arr.filter(x => x && Object.keys(x).length > 1)
}

// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	// For FlashList
	const ref = createRef<FlashList<IContact>>()
	const [isRefreshing, setIsRefreshing] = useState(false)
	// Nostr class instance
	const nostrRef = useRef<Nostr>()
	// main context
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
	// related to new npub
	const inputRef = createRef<TextInput>()
	const [newNpubModal, setNewNpubModal] = useState(false)
	// search functionality
	const [showSearch, setShowSearch] = useState(false)
	const toggleSearch = useCallback(() => setShowSearch(prev => !prev), [])
	// contact list
	const [contacts, setContacts] = useState<IContact[]>([])
	// TODO we have 3 copies of contacts, this is not good (the class instance, the state and the ref)
	const contactsRef = useRef<IContact[]>([])
	const recentsRef = useRef<IContact[]>([])
	// last seen contact index
	const last = useRef({ idx: -1 })
	// contacts that have been recently used for sending ecash
	const [recents, setRecents] = useState<IContact[]>([])
	// sync status
	const [hasFullySynced, setHasFullySynced] = useState(!!nostrRef.current?.isSync)
	const abortControllerRef = useRef<AbortController>()
	// const [status, setStatus] = useState({ started: false, finished: false })
	// const [syncModal, setSyncModal] = useState(false)
	// const [progress, setProgress] = useState(0)
	// const [doneCount, setDoneCount] = useState(0)
	const isSending = useMemo(() => route.params?.isMelt || route.params?.isSendEcash, [route.params?.isMelt, route.params?.isSendEcash])

	// gets nostr data from cache or relay while scrolling
	const next = useCallback((contactsTodo: string[]) => {
		if (nostrRef.current?.isSync) { return }
		void nostrRef.current?.setupMetadataSubMany({
			// contactsView,
			hasArr: filterContactArr(
				contacts?.length ? contacts : contactsRef?.current ?? []
			),
			toDo: contactsTodo,
			count: 15,
			sig: abortControllerRef?.current?.signal,
			emitOnProfileChanged: {
				emitAsap: false,
				emitOnEose: true
			},
			// noCache: true,
			onEose: (done, authors) => {
				l('[onEose]', { done: done.length, authors: authors.length })
				if (done.length === authors.length) {
					setHasFullySynced(true)
					// TODO also set this state if class instance logs [setupMetadataSubMany] no more to do
					return
				}
				if (done.length < 2) {
					// TODO Handle this case
					// maybe ?
					// void next()
				}
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// gets initial nostr data from cache or relay
	const initContacts = useCallback(async (hex: string) => {
		stopLoading()
		if (!nostrRef?.current?.hex || hex !== nostrRef.current.hex) {
			nostrRef.current = new Nostr(hex, {
				onUserMetadataChanged: p => setUserProfile(p),
				onContactsChanged: allContacts => {
					if (!allContacts?.length) { return }
					// we simply overwrite the previous state with the new one
					const c = allContacts.map(x => ({ hex: x })).sort(sortFavs)
					contactsRef.current = c
					setContacts(c)
					// first render of contacts metadata happens in flashlist event onViewableItemsChanged
				},
				onProfileChanged: profiles => {
					l({ onProfileChangeEventProfiles: profiles?.length, should: contactsRef.current.length + (profiles?.length ?? 0) })
					setContacts(prev => {
						if (!profiles?.length) { return prev }
						const c = prev.map(p => {
							const idx = profiles?.findIndex(x => x?.hex === p?.hex)
							return idx < 0 ? p : profiles[idx]
						})
						contactsRef.current = c
						return c
					})
				},
				userRelays
			})
			await nostrRef.current.initUserData(userRelays)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [next, userRelays])

	const shouldCallNext = useCallback((firstIdx: number, lastIdx: number, isScrollingUp = false) => {
		// I loop over items in viewport and 10 items before and after the viewport to check if there are items without metadata
		// if there are items without metadata, I return true to call next()
		// if there are no items without metadata, I return false to avoid calling next()
		// first I check if there are items without metadata within the viewport regardless of scroll direction
		// then I check the scroll direction and based on it,
		// I check if there are items without metadata above or below the viewport
		const resp: IShouldCallNext = { shouldCall: false, todo: [] }
		for (let i = firstIdx - 10; i < lastIdx + 10; i++) {
			// skip negative indices
			if (i < 0) { continue }
			// avoid access of items beyond the array length
			if (i >= contactsRef.current.length - 1) { break }
			const contact = contactsRef.current[i]
			// avoid access of undefined items
			if (!contact) { continue }
			const hasNoMetadata = Object.keys(contact).length === 1
			if (!hasNoMetadata) { continue }
			resp.todo.push(contact.hex)
			if (resp.shouldCall) { continue }
			// found item without metadata above viewport
			if (isScrollingUp) {
				if (i < lastIdx && hasNoMetadata) {
					l('[shouldCallNext] found item without metadata above viewport. index: ', i)
					resp.shouldCall = true
					continue
				}
			}
			// found item without metadata within viewport
			if (i <= firstIdx && i >= lastIdx && hasNoMetadata) {
				l('[shouldCallNext] found item without metadata within viewport. index: ', i)
				resp.shouldCall = true
				continue
			}
			// found item without metadata below viewport
			if (i > firstIdx && hasNoMetadata) {
				l('[shouldCallNext] found item without metadata below viewport. index: ', i)
				resp.shouldCall = true
				continue
			}
		}
		l('[shouldCallNext] all items have metadata')
		return resp
	}, [])

	// debounce flashlist viewability event to avoid too many calls of next()
	const onViewableItemsChanged = debounce(useCallback(({ viewableItems }: IViewableItems) => {
		const firstIdx = viewableItems?.[0]?.index
		const lastIdx = viewableItems?.[viewableItems.length - 1]?.index
		if (!isNum(firstIdx) || !isNum(lastIdx)) { return }
		// initial render
		if (last.current.idx === -1) {
			last.current.idx = firstIdx
			return next(viewableItems.map(i => i.item.hex))
		}
		const { shouldCall, todo } = shouldCallNext(firstIdx, lastIdx, last.current.idx > firstIdx)
		if (!shouldCall) { return }
		if (last.current.idx > firstIdx) { // scrolling up
			last.current.idx = firstIdx
			void next(todo)
		} else if (last.current.idx < firstIdx) { // scrolling down
			last.current.idx = firstIdx
			void next(todo)
		}
	}, [next, shouldCallNext]), 150)

	// bring favs on top of the list
	const sortFavs = (a: IContact, b: IContact) => {
		const aIsFav = favs.includes(a.hex)
		const bIsFav = favs.includes(b.hex)
		// a comes before b (a is a favorite)
		if (aIsFav && !bIsFav) { return -1 }
		// b comes before a (b is a favorite)
		if (!aIsFav && bIsFav) { return 1 }
		return 0
	}

	// const handleSync = async () => {
	// 	l('call handleSync function')
	// 	if (!nostrRef.current) { return }
	// 	abortControllerRef.current = new AbortController()
	// 	setProgress(0)
	// 	setDoneCount(0)
	// 	setStatus(prev => ({ ...prev, started: true }))
	// 	await nostrRef.current.setupMetadataSubAll({ sig: abortControllerRef.current.signal })
	// 	//setContacts(Object.entries(result?.result || {}).map(([hex, profile]) => ({ hex, profile })))
	// 	abortControllerRef.current = undefined
	// }

	// const handleCancel = () => {
	// 	l('call hanbleCancel function')
	// 	abortControllerRef.current?.abort()
	// 	setStatus({ started: false, finished: true })
	// 	setSyncModal(false)
	// }

	const handleSearch = (text: string) => {
		// reset search results
		if (!text.length) {
			return setContacts(contactsRef.current)
		}
		// handle npub search
		if (isNpub(text)) {
			const hex = nip19.decode(text).data
			const filtered = contactsRef.current.filter(c => c.hex === hex)
			// TODO if npub is not in contact list, search for it in relay and display result
			// nostrRef.current?.search(text)
			return setContacts(filtered)
		}
		// handle search by username if all contacts have been synced
		if (hasFullySynced) {
			const filtered = contactsRef.current.filter(c => getNostrUsername(c).toLowerCase().includes(text.toLowerCase()))
			return setContacts(filtered)
		}
		// TODO handle nip50 search
		nostrRef.current?.search(text)
	}

	// handle npub input field
	const handleNpubInput = async () => {
		l('call handleNpubInput function')
		startLoading()
		setNewNpubModal(false)
		// l('1')
		if (!pubKey.encoded && !pubKey.hex) {
			stopLoading()
			openPromptAutoClose({ msg: t('invalidPubKey') })
			return
		}
		// l('2')
		let pub = { encoded: '', hex: '' }
		// check if is npub
		if (isNpub(pubKey.encoded)) {
			l('input is npub')
			pub = { encoded: pubKey.encoded, hex: nip19.decode(pubKey.encoded).data || '' }
			l({ pub })
			setPubKey(pub)
			// start initialization of nostr data
			await handleNewNpub(pub)
			return
		}
		// l('4')
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
		// l('6')
		// start initialization of nostr data
		await handleNewNpub(pub)
	}

	// handle new pasted npub and initialize nostr data
	const handleNewNpub = async (pub: { encoded: string, hex: string }) => {
		l('call handleNewNpub function')
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
		l('call handleSend function')
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
		l('call handleRefresh function')
		// TODO check if user has internet connection, otherwise show error
		setIsRefreshing(true)
		setUserProfile(undefined)
		setContacts([])
		await Promise.allSettled([
			nostrRef?.current?.cleanCache(),
			Image.clearDiskCache(),
			store.delete(STORE_KEYS.synced)
		])
		nostrRef.current = undefined
		contactsRef.current = []
		setHasFullySynced(false)
		last.current.idx = -1
		await initContacts(pubKey.hex)
		setIsRefreshing(false)
	}

	// check if user has nostr data saved previously
	useEffect(() => {
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

	useEffect(() => {
		setContacts([...contacts].sort(sortFavs))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [favs])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut') : t('addressBook', { ns: NS.topNav })}
				withBackBtn={isSending}
				nostrProfile={userProfile?.picture}
				showSearch={pubKey.hex.length > 0}
				toggleSearch={toggleSearch}
				handlePress={() => navigation.goBack()}
				openProfile={() => navigation.navigate('Contact', {
					contact: userProfile,
					hex: pubKey.hex,
					isUser: true
				})}
				loading={loading}
				noIcons
			/>
			{/* <Text style={{ color: color.TEXT }}>
				{filterContactArr(contacts)?.length}/{contactsRef.current.length}
				{' ('}{(filterContactArr(contacts)?.length * 100 / contactsRef.current.length).toFixed(2)}%{') '}
			</Text> */}
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
										isFav={favs.includes(item.hex)}
										recyclingKey={item.hex}
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
								data={contacts}
								viewabilityConfig={{ minimumViewTime: 500 }}
								estimatedItemSize={75}
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
										// TODO fix this contact type
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
										recyclingKey={item.hex}
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
			{/* <SyncModal
				visible={syncModal}
				close={() => setSyncModal(false)}
				status={status}
				handleSync={() => void handleSync()}
				handleCancel={handleCancel}
				progress={progress}
				contactsCount={contactsRef.current.length}
				doneCount={doneCount}
			/> */}
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
