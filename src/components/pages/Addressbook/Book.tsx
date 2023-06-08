import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { PlusIcon, UserIcon } from '@comps/Icons'
import { addContact, getContacts } from '@db'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
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
	const { prompt, openPrompt, closePrompt } = usePrompt()
	const handleNewContact = async () => {
		if (!isLnurl(newContactLN)) {
			openPrompt('Invalid LN address!')
			return
		}
		const success = await addContact({
			name: openNew.isOwner ? 'Personal address' : newContactName,
			ln: newContactLN,
			isOwner: openNew.isOwner
		})
		setContacts(await getContacts())
		if (!success) {
			openPrompt('Contact can not be added. Possible name or address duplication.')
			return
		}
		setOpenNew({ open: false, isOwner: false })
	}
	return (
		<>
			{/* Header */}
			<View style={styles.headerWrap}>
				<View>
					<Text style={[globals(color).header, { marginBottom: 0 }]}>
						Address book
					</Text>
					<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
						{!contacts.length ?
							''
							:
							`${contacts.length} Contact${contacts.length > 1 ? 's' : ''}`
						}
					</Text>
				</View>
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
					<TouchableOpacity
						style={{ paddingVertical: 15, paddingLeft: 10 }}
						onPress={() => setOpenNew({ open: true, isOwner: false })}
					>
						<PlusIcon width={22} height={22} color={color.TEXT} />
					</TouchableOpacity>
				}
			</View>
			{/* Address list */}
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* user own address */}
				{hasOwnAddress() ?
					<View style={styles.bookEntry}>
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
						style={styles.bookEntry}
						onPress={() => {
							setOpenNew({ open: true, isOwner: true })
						}}
					>
						<Text style={styles.addOwnAddress}>
							<PlusIcon width={16} height={16} color={hi[highlight]} />
						</Text>
						<View style={styles.nameEntry}>
							<Text style={[globals(color).txt, { color: hi[highlight] }]}>
								Add your own LN address
							</Text>
						</View>
					</TouchableOpacity>
				}
				<View style={styles.bookContainer}>
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
									<Text style={globals(color).txt}>
										{c.name}
									</Text>
								</TouchableOpacity>
							</View>
							{i < contacts.length - 1 && <View style={[styles.separator, { borderBottomColor: color.BORDER }]} />}
						</View>
					))}
				</View>
			</ScrollView>
			{/* Add new address modal */}
			{openNew.open && !prompt.open &&
				<MyModal type='bottom' animation='slide' visible={true}>
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
					<Button txt='Save' onPress={() => {
						void handleNewContact()
					}}
					/>
					<TouchableOpacity
						style={{ marginTop: 25 }}
						onPress={() => setOpenNew({ open: false, isOwner: false })}
					>
						<Text style={globals(color, highlight).pressTxt}>
							Cancel
						</Text>
					</TouchableOpacity>
				</MyModal>
			}
			<PromptModal
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	headerWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 20,
		width: '100%',
	},
	subHeader: {
		fontSize: 16,
	},
	bookContainer: {
		width: '100%',
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
		paddingHorizontal: 15,
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