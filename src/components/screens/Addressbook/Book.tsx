import Button, { IconBtn } from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { PlusIcon, UserIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { addContact, getContacts } from '@db'
import MyModal from '@modal'
import type { TAddressBookPageProps } from '@model/nav'
import { ContactsContext } from '@src/context/Contacts'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { isLnurl } from '@util'
import { useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface IAddressBookProps {
	nav?: TAddressBookPageProps
	isModal?: boolean,
	closeModal?: () => void
	setInput?: (val: string) => void
}

export default function AddressBook({ nav, isModal, closeModal, setInput }: IAddressBookProps) {
	const { color, highlight } = useContext(ThemeContext)
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
	const { prompt, openPromptAutoClose } = usePrompt()
	const handleNewContact = async () => {
		const contact = {
			name: newContact.name.trim(),
			lnUrl: newContact.lnUrl.trim(),
		}
		if (!isLnurl(contact.lnUrl)) {
			openPromptAutoClose({ msg: 'Invalid LNURL!', ms: 1500 })
			return
		}
		if (!contact.name && !openNew.isOwner) {
			openPromptAutoClose({ msg: 'Invalid name!', ms: 1500 })
			return
		}
		const success = await addContact({
			name: openNew.isOwner ? 'Personal LNURL' : contact.name,
			ln: contact.lnUrl,
			isOwner: openNew.isOwner
		})
		if (!success) {
			openPromptAutoClose({ msg: 'Contact can not be added. Possible name or LNURL duplication.' })
			return
		}
		setContacts(await getContacts())
		openPromptAutoClose({ msg: 'Added a new contact', success: true })
		setOpenNew({ open: false, isOwner: false })
	}
	return (
		<>
			{/* Header */}
			{isModal ?
				<View style={styles.modalHeader}>
					<View>
						<Txt txt='Address book' styles={[globals(color).navTxt, styles.header]} />
						<ContactsCount count={contacts.length} />
					</View>
					{/* cancel modal / go back to payment page */}
					<TouchableOpacity
						style={{ paddingVertical: 10 }}
						onPress={() => closeModal?.()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
				:
				<View style={styles.bookHeader}>
					<ContactsCount count={contacts.length} />
				</View>
			}
			{/* Address list */}
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				{/* user own LNURL */}
				{hasOwnAddress() ?
					<View style={[globals(color).wrapContainer, styles.bookEntry, styles.container]}>
						<Text style={[
							styles.circleUser,
							{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG, color: color.TEXT }
						]}>
							<UserIcon width={20} height={20} color={hi[highlight]} />
						</Text>
						<TouchableOpacity
							style={styles.nameEntry}
							onPress={() => {
								const personalInfo = getPersonalInfo()
								if (!personalInfo) { return }
								if (isModal) {
									setInput?.(personalInfo.ln)
									closeModal?.()
									return
								}
								nav?.navigation.navigate('Contact', {
									contact: personalInfo
								})
							}}
						>
							<Txt txt={getPersonalInfo()?.ln || ''} />
						</TouchableOpacity>
					</View>
					:
					<TouchableOpacity
						style={[styles.bookEntry, styles.container, { borderColor: color.BORDER, backgroundColor: color.INPUT_BG }]}
						testID='addPersonal'
						onPress={() => {
							setOpenNew({ open: true, isOwner: true })
						}}
					>
						<Text style={styles.addOwnAddress}>
							<PlusIcon width={16} height={16} color={hi[highlight]} />
						</Text>
						<View style={styles.nameEntry}>
							<Txt txt='Add your own LNURL' styles={[{ color: hi[highlight] }]} />
						</View>
					</TouchableOpacity>
				}
				{contacts.length > 0 &&
					<View style={[globals(color).wrapContainer, styles.bookContainer]}>
						{contacts.sort((a, b) => a.name.localeCompare(b.name)).map((c, i) => (
							!c.isOwner &&
							<View key={c.ln}>
								<View style={styles.bookEntry}>
									<Text style={[
										styles.circle,
										{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG, color: color.TEXT }
									]}>
										{c.name.charAt(0).toUpperCase()}
									</Text>
									<TouchableOpacity
										style={styles.nameEntry}
										onPress={() => {
											if (isModal) {
												setInput?.(c.ln)
												closeModal?.()
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
								{i < contacts.length - 1 && <Separator style={[{ marginLeft: 60 }]} />}
							</View>
						))}
					</View>
				}
			</ScrollView>
			{/* Add new contact button */}
			{!isModal &&
				<View style={styles.newContactBtn}>
					<IconBtn
						icon={<PlusIcon width={15} height={15} color='#FAFAFA' />}
						onPress={() => setOpenNew({ open: true, isOwner: false })}
						testId='testNewContact'
					/>
				</View>
			}
			{/* Add new contact modal */}
			<MyModal type='bottom' animation='slide' visible={openNew.open && !prompt.open}>
				<Text style={globals(color).modalHeader}>
					{openNew.isOwner ? 'Your LNURL' : 'New contact'}
				</Text>
				{!openNew.isOwner &&
					<TextInput
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder="Name"
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						onChangeText={name => setNewContact({ ...newContact, name })}
					/>
				}
				<TextInput
					style={[globals(color).input, { marginBottom: 20 }]}
					placeholder="zap@me.now"
					placeholderTextColor={color.INPUT_PH}
					selectionColor={hi[highlight]}
					onChangeText={lnUrl => setNewContact({ ...newContact, lnUrl })}
				/>
				<Button txt='Save' onPress={() => void handleNewContact()} />
				<TouchableOpacity
					style={styles.cancel}
					onPress={() => setOpenNew({ open: false, isOwner: false })}
				>
					<Text style={globals(color, highlight).pressTxt}>
						Cancel
					</Text>
				</TouchableOpacity>
			</MyModal>
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
		</>
	)
}

function ContactsCount({ count }: { count: number }) {
	const { color } = useContext(ThemeContext)
	return (
		<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
			{!count ?
				''
				:
				`${count} Contact${count > 1 ? 's' : ''}`
			}
		</Text>
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
	},
	header: {
		marginBottom: 10,
	},
	scroll: {
		width: '100%'
	},
	container: {
		paddingVertical: 10,
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
		textAlign: 'center',
		borderWidth: 1,
		borderRadius: 50,
		paddingHorizontal: 15,
		paddingVertical: 10,
		marginRight: 20,
	},
	circleUser: {
		borderWidth: 1,
		borderRadius: 50,
		paddingHorizontal: 10,
		paddingVertical: 10,
		marginRight: 20,
	},
	addOwnAddress: {
		paddingVertical: 10,
		marginHorizontal: 20,
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