import Button, { TxtButton } from '@comps/Button'
import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import { QRIcon, ScanQRIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import { getMintsBalances } from '@db'
import type { INostrSendData, TAddressBookPageProps } from '@model/nav'
import type { IContact } from '@model/nostr'
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
import { debounce, isNum, uniq, uniqByIContacts } from '@util'
import { Image } from 'expo-image'
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import ContactPreview from './ContactPreview'
import Recents from './Recents'
import Search from './Search'

/****************************************************************************/
/* State issues will occur while debugging Android and IOS at the same time */
/****************************************************************************/

interface CustomViewToken {
	item: IContact
	key: string
	index: number | null
	isViewable: boolean
	timestamp: number
}

interface IViewableItems { viewableItems: CustomViewToken[] }

export interface ISearchStates {
	input: string
	isSearching: boolean
	results: IContact[]
	hasResults: boolean
}

const marginBottomPayment = isIOS ? vs(20) : 0

// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	// For FlashList
	const ref = createRef<FlashList<IContact>>()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const searchListRef = createRef<FlashList<IContact>>()
	// Nostr class instance
	const nostrRef = useRef<Nostr>()
	const abortControllerRef = useRef<AbortController>()
	// main context
	const { t } = useTranslation([NS.common])
	const isFocused = useIsFocused()
	const { isKeyboardOpen } = useKeyboardCtx()
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const { nostr, setNostr } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	// related to new npub
	const [newNpubModal, setNewNpubModal] = useState(false)
	const [input, setInput] = useState('')
	// search functionality
	const [search, setSearch] = useState<ISearchStates>({
		input: '',
		isSearching: false,
		results: [],
		hasResults: true,
	})
	// contact list
	const [contacts, setContacts] = useState<IContact[]>([])
	// TODO we have 3 copies of contacts, this is not good (the class instance, the state and the ref)
	const contactsRef = useRef<IContact[]>([])
	// last seen contact index
	const last = useRef({ idx: -1 })

	const isPayment = useMemo(() => route.params?.isMelt || route.params?.isSendEcash, [route.params?.isMelt, route.params?.isSendEcash])

	// gets nostr data from cache or relay while scrolling
	const next = useCallback((toDo: string[]) => {
		if (nostrRef.current?.isSync) { return }
		void nostrRef.current?.setupMetadataSubMany({
			toDo,
			count: 15,
			sig: abortControllerRef?.current?.signal,
			emitOnProfileChanged: {
				emitAsap: false,
				emitOnEose: true
			},
			// noCache: true,
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// gets initial nostr data from cache or relay
	const initContacts = useCallback(async (hex: string) => {
		stopLoading()
		if (!nostrRef?.current?.hex || hex !== nostrRef.current.hex) {
			const { userRelays } = nostr
			nostrRef.current = new Nostr(hex, {
				onUserMetadataChanged: p => {
					setNostr(prev => ({ ...prev, userProfile: p, lud16: p?.lud16 ?? '' }))
					void store.set(STORE_KEYS.lud16, p?.lud16 ?? '')
				},
				onContactsChanged: allContacts => {
					if (!allContacts?.length) { return }
					// we simply overwrite the previous state with the new one
					const c = uniq(allContacts).map(hex => ({ hex })).sort(sortFavs)
					contactsRef.current = c
					setContacts(c)
					// first render of contacts metadata happens in flashlist event onViewableItemsChanged
				},
				onProfileChanged: profiles => {
					// l({ onProfileChangeEventProfiles: profiles?.length, should: contactsRef.current.length + (profiles?.length ?? 0) })
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
				onSearchChanged: profile => {
					if (!profile) {
						return setSearch(prev => ({ ...prev, isSearching: false, hasResults: false }))
					}
					if (search.isSearching) { setSearch(prev => ({ ...prev, isSearching: false })) }
					if (!search.hasResults) { setSearch(prev => ({ ...prev, hasResults: true })) }
					setSearch(prev => ({ ...prev, results: uniqByIContacts([...prev.results, profile], 'hex') }))
					// we set the contact state of a search result that is already in the contacts list
					// so that the contact list can render the profile if user favorites it
					// TODO cache it
					const idx = contactsRef.current.findIndex(c => c.hex === profile.hex)
					if (idx > -1 && Object.keys(contactsRef.current[idx]).length === 1) {
						setContacts(prev => {
							prev[idx] = profile
							contactsRef.current = prev
							return [...prev]
						})
					}
				},
				userRelays,
			})
			await nostrRef.current.initUserData(nostr.userRelays)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [next, nostr.userRelays])

	const shouldCallNext = useCallback((firstIdx: number, lastIdx: number, isScrollingUp: boolean) => {
		const startIdx = firstIdx - 10 < 0 ? 0 : firstIdx - 10
		const lastContactIdx = contactsRef.current.length - 1
		const endIdx = lastIdx + 10 > lastContactIdx ? lastContactIdx : lastIdx + 10
		for (let i = startIdx; i < endIdx; i++) {
			const contact = contactsRef.current[i]
			// avoid access of undefined items
			if (!contact) { continue }
			const hasNoMetadata = Object.keys(contact).length === 1
			if (!hasNoMetadata) { continue }
			// found item without metadata above viewport
			if (isScrollingUp) {
				if (i < lastIdx && hasNoMetadata) {
					return true
				}
			}
			// found item without metadata within viewport
			if (i <= firstIdx && i >= lastIdx && hasNoMetadata) {
				return true
			}
			// found item without metadata below viewport
			if (i > firstIdx && hasNoMetadata) {
				return true
			}
		}
		return false
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
		const shouldCall = shouldCallNext(firstIdx, lastIdx, last.current.idx > firstIdx)
		if (!shouldCall) { return }
		const startIdx = firstIdx - 10
		const endIdx = lastIdx + 10
		const todo = contactsRef.current.slice(
			startIdx < 0 ? 0 : startIdx,
			endIdx > contactsRef.current.length - 1 ? contactsRef.current.length - 1 : endIdx
		).map(c => c.hex)
		if (last.current.idx > firstIdx) { // scrolling up
			last.current.idx = firstIdx
			void next(todo)
		} else if (last.current.idx < firstIdx) { // scrolling down
			last.current.idx = firstIdx
			void next(todo)
		}
	}, [next, shouldCallNext]), 150)

	// bring favs on top of the list
	const sortFavs = useCallback((a: IContact, b: IContact) => {
		const aIsFav = nostr.favs.includes(a.hex)
		const bIsFav = nostr.favs.includes(b.hex)
		// a comes before b (a is a favorite)
		if (aIsFav && !bIsFav) { return -1 }
		// b comes before a (b is a favorite)
		if (!aIsFav && bIsFav) { return 1 }
		return 0
	}, [nostr.favs])

	// handle npub/hex input field
	const handleNpubInput = async () => {
		startLoading()
		setNewNpubModal(false)
		let pub = { encoded: '', hex: '' }
		if (isNpub(input)) {
			pub = { encoded: input, hex: nip19.decode(input).data || '' }
			setNostr(prev => ({ ...prev, pubKey: pub }))
			// start initialization of nostr data
			await handleNewNpub(pub)
			return
		}
		if (isHex(input)) {
			pub = { encoded: nip19.npubEncode(input), hex: input }
			setNostr(prev => ({ ...prev, pubKey: pub }))
			// start initialization of nostr data
			await handleNewNpub(pub)
			return
		}
		// not npub nor hex
		openPromptAutoClose({ msg: t('invalidPubKey') })
		stopLoading()
	}

	// handle new pasted npub and initialize nostr data
	const handleNewNpub = async (pub: { encoded: string, hex: string }) => {
		// generate new secret key if there is none
		if (!nostr.nutPub) {
			const sk = generatePrivateKey() // `sk` is a hex string
			const pk = getPublicKey(sk)		// `pk` is a hex string
			await Promise.all([
				store.set(STORE_KEYS.nutpub, pk),		// save enuts hex pubKey
				secureStore.set(SECRET, sk)				// save nostr secret generated by enuts for nostr DM interactions
			])
			setNostr(prev => ({ ...prev, nutPub: pk }))
		}
		await Promise.all([
			store.set(STORE_KEYS.npub, pub.encoded), 	// save nostr encoded pubKey
			store.set(STORE_KEYS.npubHex, pub.hex),		// save nostr hex pubKey
		])
		void initContacts(pub.hex)
	}

	// user presses the send ecash button
	const handleSend = async (contact: IContact) => {
		const nostrData: INostrSendData = {
			senderName: getNostrUsername(nostr.userProfile),
			contact,
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
			return navigation.navigate('selectAmount', { isMelt, lnurl: { userInput: contact.lud16 }, mint, balance })
		}
		if (!nostrRef.current) { return }
		// mint has already been selected
		if (route.params?.mint) {
			return navigation.navigate('selectNostrAmount', {
				mint: route.params.mint,
				balance: route.params.balance,
				nostr: nostrData,
			})
		}
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		if (nonEmptyMints.length === 1) {
			return navigation.navigate('selectNostrAmount', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				balance: nonEmptyMints[0].amount,
				nostr: nostrData,
			})
		}
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal,
			allMintsEmpty: !nonEmptyMints.length,
			isSendEcash: true,
			nostr: nostrData,
		})
	}

	const handleRefresh = async () => {
		// TODO check if user has internet connection, otherwise show error
		setIsRefreshing(true)
		setNostr(prev => ({ ...prev, userProfile: undefined }))
		setContacts([])
		await Promise.all([
			nostrRef.current?.cleanCache(),
			Image.clearDiskCache(),
		])
		nostrRef.current = undefined
		contactsRef.current = []
		last.current.idx = -1
		setIsRefreshing(false)
		void initContacts(nostr.pubKey.hex)
	}

	// check if user has nostr data saved previously
	useEffect(() => {
		if (!isFocused || nostr.pubKey.hex === nostrRef.current?.hex) { return }
		setContacts([]) // reset contacts in case user has edited his npub
		setSearch(prev => ({ ...prev, results: [] }))
		last.current.idx = -1
		// user has no nostr data yet
		if (!nostr.pubKey.encoded || !nostr.pubKey.hex) {
			setNewNpubModal(true)
			return stopLoading()
		}
		// user has nostr data, set states
		void initContacts(nostr.pubKey.hex)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFocused])

	useEffect(() => {
		setContacts(prev => [...uniqByIContacts(prev, 'hex')].sort(sortFavs))
		// re-render search results if favs change
		if (search.results.length) {
			setSearch(prev => ({
				...prev,
				results: uniqByIContacts(prev.results.sort(sortFavs), 'hex')
			}))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nostr.favs])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut') : t('addressBook', { ns: NS.topNav })}
				withBackBtn={isPayment}
				nostrProfile={nostr.pubKey.hex.length > 0 ? nostr.userProfile?.picture : undefined}
				handlePress={() => navigation.goBack()}
				openProfile={() => navigation.navigate('Contact', {
					contact: nostr.userProfile,
					isUser: true
				})}
				loading={loading}
				noIcons
			/>
			{loading || (nostr.pubKey.hex.length && !contactsRef.current.length) ?
				<View style={styles.loadingWrap}><Loading /></View>
				:
				<>
					{/* user recently used */}
					{nostr.recent.length > 0 &&
						<Recents
							handleSend={handleSend}
						/>
					}
					{nostr.pubKey.hex.length > 0 &&
						<View style={styles.searchWrap}>
							<Search
								contactsRef={contactsRef}
								setContacts={setContacts}
								search={search}
								setSearch={setSearch}
								nostrRef={nostrRef}
								isPayment={isPayment}
							/>
							{isPayment &&
								<TouchableOpacity
									style={styles.scanQr}
									onPress={() => navigation.navigate('qr scan', { isPayment: true })}
								>
									<ScanQRIcon color={color.TEXT} />
								</TouchableOpacity>
							}
						</View>
					}
					{/* user contacts */}
					{contactsRef.current.length > 0 ?
						<View style={[
							styles.contactsWrap,
							{ marginBottom: isKeyboardOpen || isPayment ? marginBottomPayment : vs(60) },
						]}>
							{search.input.length > 0 && search.results.length > 0 && search.hasResults ?
								<FlashList
									ref={searchListRef}
									data={search.results}
									estimatedItemSize={75}
									keyExtractor={item => item.hex}
									renderItem={({ item }) => (
										<ContactPreview
											contact={item}
											openProfile={() => {
												navigation.navigate('Contact', { contact: item })
											}}
											handleSend={() => void handleSend(item)}
											isPayment={isPayment}
											isInContacts={contactsRef.current.some(c => c.hex === item.hex)}
											isSearchResult
										/>
									)}
									ListEmptyComponent={() => (
										<Empty txt={t('noResults', { ns: NS.addrBook })} />
									)}
									ItemSeparatorComponent={() => (
										<Separator style={[styles.contactSeparator]} />
									)}
								/>
								: search.input.length > 0 && !search.results.length && !search.hasResults ?
									<Txt txt='No results' bold center />
									:
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
												contact={item}
												openProfile={() => {
													navigation.navigate('Contact', {
														contact: item,
													})
												}}
												handleSend={() => void handleSend(item)}
												isPayment={isPayment}
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
							}
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
						onChangeText={text => setInput(text)}
						value={input}
						onSubmitEditing={() => void handleNpubInput()}
						style={[{ paddingRight: s(55) }]}
					/>
					{/* scan icon */}
					<TouchableOpacity
						style={styles.inputQR}
						onPress={() => {
							setNewNpubModal(false)
							const t = setTimeout(() => {
								navigation.navigate('qr scan', {})
								clearTimeout(t)
							}, 200)
						}}
					>
						<QRIcon color={color.INPUT_PH} />
					</TouchableOpacity>
				</View>
				<Button
					txt={t('submit')}
					onPress={() => void handleNpubInput()}
				/>
				<TxtButton
					txt={t('cancel')}
					onPress={() => setNewNpubModal(false)}
				/>
			</MyModal>
			{!isKeyboardOpen && !route.params?.isMelt && !route.params?.isSendEcash &&
				<BottomNav navigation={navigation} route={route} />
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: '80@vs'
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: '100@vs',
	},
	contactsWrap: {
		flex: 1,
	},
	contactSeparator: {
		marginHorizontal: '20@s',
		marginTop: 0,
		marginBottom: 0,
	},
	wrap: {
		position: 'relative',
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	inputQR: {
		position: 'absolute',
		right: '13@s',
		height: '41@vs',
		paddingHorizontal: '10@s',
	},
	searchWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: '20@s'
	},
	scanQr: {
		paddingVertical: '10@s',
		paddingLeft: '10@s',
		marginBottom: '5@vs'
	}
})
