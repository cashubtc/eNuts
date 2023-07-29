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
import type { IProfileContent } from '@model/nostr'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { relayPool } from '@nostr/Connection'
import { EventKind, npubLength } from '@nostr/consts'
import { parseProfileContent } from '@nostr/util'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { isStr } from '@util'
import * as Clipboard from 'expo-clipboard'
import { type Event as NostrEvent, nip19 } from 'nostr-tools'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import ContactPreview from './ContactPreview'
import ProfilePic from './ProfilePic'
import Username from './Username'

export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [npub, setNpub] = useState('')
	const [id, setId] = useState('')
	const [userProfile, setUserProfile] = useState<IProfileContent | undefined>()
	const [contacts, setContacts] = useState<string[]>([])
	const [newNpubModal, setNewNpubModal] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()

	// user is in melting process
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
		if (npub.length > 0) {
			setNpub('')
			return
		}
		// paste from clipboard
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		setNpub(clipboard)
	}

	const handleNewNpub = async () => {
		if (!npub.length || !npub.startsWith('npub')) {
			openPromptAutoClose({ msg: 'Invalid NPUB!' })
			return
		}
		const nostrId = nip19.decode(npub).data
		l({ nostrId })
		if (!isStr(nostrId) || nostrId.length !== npubLength) {
			openPromptAutoClose({ msg: 'Something went wrong while decoding your NPUB!' })
			return
		}
		// save npub and decoded npub id
		await Promise.all([
			store.set(STORE_KEYS.npub, npub),
			store.set(STORE_KEYS.npubHex, nostrId)
		])
		setId(nostrId)
		// close modal
		setNewNpubModal(false)
		// start syncing
	}

	const handleContactPress = () => {
		// add new npub
		if (!npub) {
			setNewNpubModal(true)
			return
		}
		// user wants to melt
		if (route.params?.isMelt) {
			handleMelt()
			return
		}
		// navigate to user profile
		// TODO consider all the contacts profile, not only userProfile for contact nav params
		if (!userProfile) { return }
		navigation.navigate('Contact', {
			contact: userProfile,
			npub,
			isUser: true
		})
	}

	useEffect(() => {
		if (!id) { return }
		// TODO use cache if available (userProfile: IProfileContent & contacts: string[])
		relayPool.subscribe([], [id])
		// this is not working, missing profile metadata event
		relayPool.sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.ContactList) {
				l('set user contacts')
				setContacts(e.tags.filter(t => t[0] === 'p').map(t => t[1]))
				// TODO save in cache
			}
			if (+e.kind === EventKind.SetMetadata) {
				l('set user profile')
				setUserProfile(parseProfileContent<IProfileContent>(e))
				// TODO save in cache
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id])

	// check if user has saved npub previously
	useEffect(() => {
		void (async () => {
			const data = await Promise.all([
				store.get(STORE_KEYS.npub),
				store.get(STORE_KEYS.npubHex),
			])
			setNpub(data[0] || '')
			setId(data[1] || '')
		})()
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
				<ContactsCount count={contacts.length} />
			</View>
			{/* user own profile */}
			<TouchableOpacity
				style={[globals(color).wrapContainer, styles.bookEntry, styles.userEntryContainer]}
				onPress={handleContactPress}
			>
				<View style={styles.picNameWrap}>
					<ProfilePic uri={userProfile?.picture} withPlusIcon={!id} isUser />
					{id ?
						<Username displayName={userProfile?.displayName} username={userProfile?.username} npub={npub} />
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
						renderItem={data => (
							<>
								<Txt txt={data.item} />
								{/* <ContactPreview pubKey={data.item} handleContactPress={handleContactPress} /> */}
							</>
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
						onChangeText={text => setNpub(text)}
						value={npub}
						onSubmitEditing={() => void handleNewNpub()}
					/>
					{/* Paste / Clear Input */}
					<TouchableOpacity
						style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
						onPress={() => void handleInputLabelPress()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{!npub.length ? t('paste') : t('clear')}
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

function ContactsCount({ count }: { count: number }) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
			{!count ?
				''
				:
				count > 1 ? t('contact_other', { count }) : t('contact_one', { count })
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
		marginVertical: 20,
	},
	picNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})

/* {((contacts.length > 1 && contacts.some(c => c.isOwner)) || (contacts.length > 0 && !contacts.some(c => c.isOwner))) &&
	<View style={[globals(color).wrapContainer, styles.bookContainer]}>
		{contacts.sort((a, b) => a.name.localeCompare(b.name)).map((c, i) => (
			!c.isOwner &&
			<View key={c.ln}>
				<View style={styles.bookEntry}>
					<View
						style={[
							styles.circle,
							{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG }
						]}
					>
						<Text style={{ color: color.TEXT, fontSize: 18 }}>
							{c.name.charAt(0).toUpperCase()}
						</Text>
					</View>
					<TouchableOpacity
						style={styles.nameEntry}
						onPress={() => {
							if (nav?.route.params?.isMelt) {
								handleMelt(c.ln)
								return
							}
							nav?.navigation.navigate('Contact', {
								contact: c
							})
						}}
					>
						<Txt txt={c.name} />
					</TouchableOpacity>
				</View>
				{i < contacts.filter(c => !c.isOwner).length - 1 && <Separator style={[{ marginLeft: 60 }]} />}
			</View>
		))}
	</View>
} */