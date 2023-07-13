import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { EditIcon, TrashbinIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import { delContact, editContact as editC, getContacts } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import type { IContactPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ContactsContext } from '@src/context/Contacts'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function ContactPage({ navigation, route }: IContactPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { setContacts } = useContext(ContactsContext)
	const [editContact, setEditContact] = useState({
		name: route.params.contact?.name,
		ln: route.params.contact?.ln
	})
	const [openEdit, setOpenEdit] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()
	const handleDelete = async () => {
		const success = await delContact(route.params.contact?.id || 0)
		if (!success) {
			openPromptAutoClose({ msg: t('contactDel') })
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
			openPromptAutoClose({ msg: t('contactNotSaved') })
			setOpenEdit(false)
		}
	}
	const handleEditCancel = () => {
		setOpenEdit(false)
		setEditContact({
			name: route.params.contact?.name,
			ln: route.params.contact?.ln
		})
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
			<TopNav withBackBtn />
			{/* Contact info */}
			<View style={[styles.contactContainer, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
				<View style={[styles.circleContainer, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
					<Text style={[styles.contactPic, { color: color.TEXT }]}>
						{route.params?.contact?.name.charAt(0).toUpperCase()}
					</Text>
				</View>

				<Text style={[styles.contactName, { color: color.TEXT }]}>
					{route.params?.contact?.name}
				</Text>
				<Text style={[styles.contactAddress, { color: color.TEXT, }]}>
					{route.params?.contact?.ln}
				</Text>
			</View>
			{/* Edit/Delete contact */}
			<SafeAreaView style={styles.bottomAction}>
				<TouchableOpacity
					style={styles.action}
					onPress={() => setOpenEdit(true)}
				>
					<EditIcon width={20} height={20} color={color.TEXT} />
					<Text style={[styles.actionTxt, { color: color.TEXT, marginTop: 2 }]}>
						{t('edit')}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.action}
					onPress={() => {
						void handleDelete()
					}}
				>
					<TrashbinIcon width={18} height={18} color={color.ERROR} />
					<Text style={[styles.actionTxt, { color: color.ERROR }]}>
						{t('delete')}
					</Text>
				</TouchableOpacity>
			</SafeAreaView>
			{/* Edit contact modal */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={openEdit && !prompt.open}
				close={handleEditCancel}
			>
				<Text style={globals(color).modalHeader}>
					{t('editContact', { ns: 'addrBook' })}
				</Text>
				{!route.params.contact?.isOwner &&
					<TextInput
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder={t('name')}
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						onChangeText={name => setEditContact({ ...editContact, name })}
						value={editContact.name}
					/>
				}
				<TextInput
					style={[globals(color).input, { marginBottom: 20 }]}
					placeholder={t('zapMeNow', { ns: 'addrBook' })}
					placeholderTextColor={color.INPUT_PH}
					selectionColor={hi[highlight]}
					onChangeText={ln => setEditContact({ ...editContact, ln })}
					value={editContact.ln}
				/>
				<Button txt={t('save')} onPress={() => void handleEditContact()}
				/>
				<TouchableOpacity
					style={styles.cancel}
					onPress={handleEditCancel}
				>
					<Text style={globals(color, highlight).pressTxt}>
						{t('cancel')}
					</Text>
				</TouchableOpacity>
			</MyModal>
			{prompt.open && <Toaster txt={prompt.msg} />}
		</View >
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 100
	},
	contactContainer: {
		borderWidth: 1,
		borderRadius: 25,
		padding: 20,
		alignItems: 'center',
		marginTop: 50,
	},
	circleContainer: {
		width: 90,
		height: 90,
		borderWidth: 1,
		borderRadius: 45,
		marginTop: -70,
		marginBottom: 15,
		justifyContent: 'center',
		alignItems: 'center'
	},
	contactPic: {
		fontSize: 36,
		fontWeight: '300',
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
		flex: 1,
		position: 'absolute',
		bottom: 0,
		left: 50,
		right: 50,
		flexDirection: 'row',
		justifyContent: 'space-between',
		// paddingHorizontal: 80,
	},
	action: {
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 5,
	},
	actionTxt: {
		marginTop: 4,
		marginBottom: 2,
		fontSize: 12,
	},
	cancel: {
		marginTop: 25,
		marginBottom: 10
	}
})