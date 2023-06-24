import MyModal from '@modal'

import AddressBook from './Book'

interface IAddressBookModalProps {
	closeModal: () => void
	setInput: (val: string) => void
}

export default function AddressbookModal({ closeModal, setInput }: IAddressBookModalProps) {
	return (
		<MyModal
			type='invoiceAmount'
			animation='slide'
			visible
			hasNoPadding
			close={closeModal}
		>
			<AddressBook
				isModal
				closeModal={closeModal}
				setInput={setInput}
			/>
		</MyModal>
	)
}