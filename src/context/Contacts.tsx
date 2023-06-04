import { l } from '@log'
import { createContext, useState } from 'react'

export interface IContact {
	id?: number
	name: string,
	ln: string,
	isOwner: boolean
}

const useContacts = () => {
	const [contacts, setContacts] = useState<IContact[]>([])
	const hasOwnAddress = () => contacts.some(c => c.isOwner)
	const getPersonalInfo = () => contacts.find(c => c.isOwner)
	return {
		contacts,
		setContacts,
		hasOwnAddress,
		getPersonalInfo
	}
}
type useContactsType = ReturnType<typeof useContacts>
export const ContactsContext = createContext<useContactsType>({
	contacts: [],
	setContacts: () => l(''),
	hasOwnAddress: () => false,
	getPersonalInfo: () => ({ name: '', ln: '', isOwner: false })
})