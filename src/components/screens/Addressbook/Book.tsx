import Button, { IconBtn } from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { PlusIcon, UserIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { addContact, getContacts } from '@db'
import MyModal from '@modal'
import type { TAddressBookPageProps } from '@model/nav'
import { ContactsContext } from '@src/context/Contacts'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { isLnurl } from '@util'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface IAddressBookProps {
	nav?: TAddressBookPageProps
}

export default function AddressBook({ nav }: IAddressBookProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const insets = useSafeAreaInsets()
	// contacts hook
	const { contacts, setContacts, hasOwnAddress, getPersonalInfo } = useContext(ContactsContext)
	// new contact modal
	const [openNew, setOpenNew] = useState({
		open: false,
		isOwner: false,
	})
	// new contact input
	const [newContact, setNewContact] = useState({
		name: '',
		lnUrl: ''
	})
	const { prompt, closePrompt, openPromptAutoClose } = usePrompt()
	const handleNewContact = async () => {
		const contact = {
			name: newContact.name.trim(),
			lnUrl: newContact.lnUrl.trim(),
		}
		if (!isLnurl(contact.lnUrl)) {
			openPromptAutoClose({ msg: t('invalidLnurl', { ns: 'addrBook' }), ms: 1500 })
			return
		}
		if (!contact.name && !openNew.isOwner) {
			openPromptAutoClose({ msg: t('invalidName', { ns: 'addrBook' }), ms: 1500 })
			return
		}
		try {
			await addContact({
				name: openNew.isOwner ? t('personalLnurl', { ns: 'addrBook' }) : contact.name,
				ln: contact.lnUrl,
				isOwner: openNew.isOwner
			})
		} catch (e) {
			openPromptAutoClose({ msg: t('addContactErr', { ns: 'addrBook' }) })
			return
		}
		setContacts(await getContacts())
		openPromptAutoClose({ msg: t('addedContact', { ns: 'addrBook' }), success: true })
		setOpenNew({ open: false, isOwner: false })
	}
	const handleMelt = (lnurl: string) => {
		if (!nav?.route.params) { return }
		const { isMelt, mint, balance } = nav.route.params
		nav.navigation.navigate('selectAmount', { isMelt, lnurl, mint, balance })
	}
	return (
		<>
			{/* Header */}
			<View style={styles.bookHeader}>
				<ContactsCount count={contacts.length} />
			</View>
			{/* Address list */}
			<ScrollView
				style={[styles.scroll, { marginTop: contacts.length > 0 ? 0 : -40 }]}
				showsVerticalScrollIndicator={false}
			>
				{/* user own LNURL */}
				{hasOwnAddress() ?
					<View style={[globals(color).wrapContainer, styles.bookEntry, styles.container]}>
						<IconCircle
							icon={<UserIcon width={20} height={20} color={hi[highlight]} />}
						/>
						<TouchableOpacity
							style={styles.nameEntry}
							onPress={() => {
								const personalInfo = getPersonalInfo()
								if (!personalInfo) { return }
								if (nav?.route.params?.isMelt) {
									handleMelt(personalInfo.ln)
									return
								}
								nav?.navigation.navigate('Contact', { contact: personalInfo })
							}}
						>
							<Txt txt={getPersonalInfo()?.ln || ''} />
						</TouchableOpacity>
					</View>
					:
					<TouchableOpacity
						style={[styles.bookEntry, styles.container, globals(color).wrapContainer]}
						testID='addPersonal'
						onPress={() => setOpenNew({ open: true, isOwner: true })}
					>
						<IconCircle
							icon={<PlusIcon width={16} height={16} color={hi[highlight]} />}
						/>
						<View style={styles.nameEntry}>
							<Txt txt={t('addOwnLnurl', { ns: 'addrBook' })} styles={[{ color: hi[highlight] }]} />
						</View>
					</TouchableOpacity>
				}
				{((contacts.length > 1 && contacts.some(c => c.isOwner)) || (contacts.length > 0 && !contacts.some(c => c.isOwner))) &&
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
				}
			</ScrollView>
			{/* Add new contact button */}
			<View style={[styles.newContactBtn, { marginBottom: insets.bottom }]}>
				<IconBtn
					icon={<PlusIcon width={15} height={15} color='#FAFAFA' />}
					onPress={() => {
						closePrompt()
						setOpenNew({ open: true, isOwner: false })
					}}
					testId='testNewContact'
				/>
			</View>
			{/* Add new contact modal */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={openNew.open && !prompt.open}
				close={() => setOpenNew({ open: false, isOwner: false })}
			>
				<Text style={globals(color).modalHeader}>
					{openNew.isOwner ? t('yourLnurl', { ns: 'addrBook' }) : t('newContact', { ns: 'addrBook' })}
				</Text>
				{!openNew.isOwner &&
					<TxtInput
						placeholder={t('name')}
						onChangeText={name => setNewContact(prev => ({ ...prev, name }))}
						onSubmitEditing={() => void handleNewContact()}
					/>
				}
				<TxtInput
					keyboardType='email-address'
					placeholder={t('zapMeNow', { ns: 'addrBook' })}
					onChangeText={lnUrl => setNewContact(prev => ({ ...prev, lnUrl }))}
					onSubmitEditing={() => void handleNewContact()}
				/>
				<Button
					txt={t('save')}
					onPress={() => void handleNewContact()}
				/>
				<TouchableOpacity
					style={styles.cancel}
					onPress={() => setOpenNew({ open: false, isOwner: false })}
				>
					<Text style={globals(color, highlight).pressTxt}>
						{t('cancel')}
					</Text>
				</TouchableOpacity>
			</MyModal>
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
		</>
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

function IconCircle({ icon }: { icon: React.ReactNode }) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[
			styles.circle,
			{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG }
		]}>
			{icon}
		</View>
	)
}

const styles = StyleSheet.create({
	modalHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	bookHeader: {
		paddingHorizontal: 20,
		marginBottom: 20,
		marginTop: 100,
	},
	header: {
		marginBottom: 10,
	},
	scroll: {
		width: '100%',
		marginBottom: 30,
	},
	container: {
		paddingVertical: 9,
		marginBottom: 25,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
	},
	bookContainer: {
		marginBottom: 50,
	},
	bookEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 8,
	},
	circle: {
		borderWidth: 1,
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		marginVertical: 5,
		marginRight: 20,
	},
	nameEntry: {
		width: '100%',
		paddingVertical: 6,
	},
	newContactBtn: {
		position: 'absolute',
		right: 20,
		bottom: 80,
	},
	cancel: {
		marginTop: 25,
		marginBottom: 10
	}
})