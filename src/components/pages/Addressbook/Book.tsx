import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { PlusIcon, UserIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { addContact, getContacts } from '@db'
import MyModal from '@modal'
import { TAddressBookPageProps } from '@model/nav'
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
	const [newContactName, setNewContactName] = useState('')
	const [newContactLN, setNewContactLN] = useState('')
	const { prompt, openPromptAutoClose } = usePrompt()
	const handleNewContact = async () => {
		if (!isLnurl(newContactLN)) {
			openPromptAutoClose({ msg: 'Invalid LNURL!', ms: 1500 })
			return
		}
		if (!newContactName && !openNew.isOwner) {
			openPromptAutoClose({ msg: 'Invalid name!', ms: 1500 })
			return
		}
		const success = await addContact({
			name: openNew.isOwner ? 'Personal LNURL' : newContactName,
			ln: newContactLN,
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
			<View style={styles.headerWrap}>
				{isModal &&
					<View>
						<Text style={[styles.header, { color: color.TEXT }]}>
							Address book
						</Text>
						<ContactsCount count={contacts.length} colorSecondary />
					</View>
				}
				{isModal ?
					<TouchableOpacity
						style={{ paddingVertical: 10 }}
						onPress={() => closeModal?.()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							Cancel
						</Text>
					</TouchableOpacity>
					:
					<>
						<ContactsCount count={contacts.length} />
						<TouchableOpacity
							style={{ paddingLeft: 10 }}
							onPress={() => setOpenNew({ open: true, isOwner: false })}
							testID='testNewContact'
						>
							<PlusIcon width={20} height={20} color={color.TEXT} />
						</TouchableOpacity>
					</>
				}
			</View>
			{/* Address list */}
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				{/* user own LNURL */}
				{hasOwnAddress() ?
					<View style={[styles.bookEntry, styles.container, { borderColor: color.BORDER, backgroundColor: color.INPUT_BG }]}>
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
							<Text style={globals(color).txt}>
								{getPersonalInfo()?.ln}
							</Text>
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
							<Text style={[globals(color).txt, { color: hi[highlight] }]}>
								Add your own LNURL
							</Text>
						</View>
					</TouchableOpacity>
				}
				{contacts.length > 0 && !contacts.some(c => c.isOwner) &&
					<View style={[styles.bookContainer, { borderColor: color.BORDER, backgroundColor: color.INPUT_BG }]}>
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
								{i < contacts.length - 1 && <View style={[styles.separator, { borderBottomColor: color.BORDER }]} />}
							</View>
						))}
					</View>
				}
			</ScrollView>
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
						onChangeText={setNewContactName}
					/>
				}
				<TextInput
					style={[globals(color).input, { marginBottom: 20 }]}
					placeholder="zap@me.now"
					placeholderTextColor={color.INPUT_PH}
					selectionColor={hi[highlight]}
					onChangeText={setNewContactLN}
				/>
				<Button txt='Save' onPress={() => void handleNewContact()} />
				<TouchableOpacity
					style={{ marginTop: 25 }}
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

function ContactsCount({ count, colorSecondary }: { count: number, colorSecondary?: boolean }) {
	const { color } = useContext(ThemeContext)
	return (
		<Text style={[styles.subHeader, { color: colorSecondary ? color.TEXT_SECONDARY : color.TEXT }]}>
			{!count ?
				''
				:
				`${count} Contact${count > 1 ? 's' : ''}`
			}
		</Text>
	)
}

const styles = StyleSheet.create({
	headerWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingHorizontal: 20,
		marginBottom: 20,
		width: '100%',
	},
	header: {
		fontSize: 20,
		fontWeight: '500',
	},
	scroll: {
		width: '100%'
	},
	container: {
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
	},
	bookContainer: {
		// width: '100%',
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
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
		// paddingHorizontal: 15,
		paddingVertical: 10,
		marginRight: 16,
	},
	nameEntry: {
		width: '100%',
		paddingVertical: 6,
	},
	separator: {
		borderBottomWidth: 1,
		marginLeft: 60,
	},
})