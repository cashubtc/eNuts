import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { EditIcon, TrashbinIcon } from '@comps/Icons'
import { delContact, editContact as editC, getContacts } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { IContactPageProps } from '@model/nav'
import { ContactsContext } from '@src/context/Contacts'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function ContactPage({ navigation, route }: IContactPageProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { setContacts } = useContext(ContactsContext)
	const [editContact, setEditContact] = useState({
		name: route.params.contact?.name,
		ln: route.params.contact?.ln
	})
	const [openEdit, setOpenEdit] = useState(false)
	const { prompt, openPrompt, closePrompt } = usePrompt()
	const handleDelete = async () => {
		const success = await delContact(route.params.contact?.id || 0)
		if (!success) {
			l('delete contact error')
			return
		}
		setContacts(await getContacts())
		navigation.navigate('Address book')
	}
	const handleEditContact = async () => {
		const c = route.params.contact
		if (!c) { return }
		try {
			await editC({
				...c,
				id: c.id || 0,
				name: editContact.name || '',
				ln: editContact.ln || ''
			})
			setContacts(await getContacts())
			setOpenEdit(false)
			navigation.navigate('Address book')
		} catch (e) {
			l(e)
			openPrompt('Contact could not be saved. Possible name or address duplication.')
			setOpenEdit(false)
		}
	}
	useEffect(() => {
		setEditContact({
			name: route.params.contact?.name,
			ln: route.params.contact?.ln
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openEdit])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			{/* Go back button */}
			<View style={styles.topNav}>
				<TouchableOpacity
					style={styles.topIconR}
					onPress={() => navigation.navigate('Address book')}
				>
					<Text style={globals(color, highlight).pressTxt}>
						Back
					</Text>
				</TouchableOpacity>
			</View>
			{/* Contact info */}
			<View style={[styles.contactContainer, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
				<Text style={[styles.contactPic, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER, color: color.TEXT }]}>
					{route.params?.contact?.name.charAt(0).toUpperCase()}
				</Text>
				<Text style={[styles.contactName, { color: color.TEXT }]}>
					{route.params?.contact?.name}
				</Text>
				<Text style={[styles.contactAddress, { color: color.TEXT, }]}>
					{route.params?.contact?.ln}
				</Text>
			</View>
			{/* Edit/Delete contact */}
			<View style={styles.bottomAction}>
				<TouchableOpacity
					style={styles.action}
					onPress={() => setOpenEdit(true)}
				>
					<EditIcon width={26} height={26} color={color.TEXT} />
					<Text style={[styles.actionTxt, { color: color.TEXT }]}>
						Edit
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.action}
					onPress={() => {
						void handleDelete()
					}}
				>
					<TrashbinIcon width={24} height={24} color={color.ERROR} />
					<Text style={[styles.actionTxt, { color: color.ERROR }]}>
						Delete
					</Text>
				</TouchableOpacity>
			</View>
			{/* Edit contact modal */}
			{openEdit && !prompt.open &&
				<MyModal type='bottom' animation='slide' visible={true}>
					<Text style={globals(color).modalHeader}>
						Edit contact
					</Text>
					{!route.params.contact?.isOwner &&
						<TextInput
							style={[globals(color).input, { marginBottom: 20 }]}
							placeholder="Name"
							placeholderTextColor={color.INPUT_PH}
							selectionColor={hi[highlight]}
							onChangeText={name => setEditContact({ ...editContact, name })}
							value={editContact.name}
						/>
					}
					<TextInput
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder="zap@me.now"
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						onChangeText={ln => setEditContact({ ...editContact, ln })}
						value={editContact.ln}
					/>
					<Button txt='Save' onPress={() => {
						void handleEditContact()
					}}
					/>
					<TouchableOpacity
						style={{ marginTop: 25 }}
						onPress={() => {
							setOpenEdit(false)
							setEditContact({
								name: route.params.contact?.name,
								ln: route.params.contact?.ln
							})
						}}
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
				close={() => {
					closePrompt()
					setOpenEdit(true)
				}}
			/>
		</View >
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 130
	},
	topNav: {
		position: 'absolute',
		top: 75,
		left: 20,
		right: 20,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	topIconR: {
		paddingLeft: 20,
		paddingBottom: 20
	},
	contactContainer: {
		borderWidth: 1,
		borderRadius: 25,
		padding: 20,
		alignItems: 'center',
		marginTop: 50,
	},
	contactPic: {
		borderRadius: 50,
		borderWidth: 1,
		paddingVertical: 20,
		paddingHorizontal: 35,
		fontSize: 36,
		fontWeight: '300',
		marginTop: -70,
		marginBottom: 15,
	},
	contactName: {
		fontSize: 26,
		fontWeight: '500'
	},
	contactAddress: {
		fontSize: 16,
		marginVertical: 10,
	},
	bottomAction: {
		position: 'absolute',
		bottom: 0,
		left: 20,
		right: 20,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 50,
		paddingBottom: 15,
	},
	action: {
		alignItems: 'center',
		padding: 10
	},
	actionTxt: {
		marginTop: 5,
		fontSize: 16,
	}
})