import { SearchIcon } from '@comps/Icons'
import TxtInput from '@comps/TxtInput'
import type { IContact } from '@model/nostr'
import type { Nostr } from '@nostr/class/Nostr'
import { getNostrUsername, isNpub } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi } from '@styles'
import { nip19 } from 'nostr-tools'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ISearchProps {
	hasFullySynced: boolean
	contactsRef: React.MutableRefObject<IContact[]>
	searchResults: IContact[]
	setSearchResults: (contacts: IContact[]) => void
	setContacts: (contacts: IContact[]) => void
	nostrRef: React.MutableRefObject<Nostr | undefined>
}

export default function Search({
	hasFullySynced,
	contactsRef,
	setContacts,
	searchResults,
	setSearchResults,
	nostrRef
}: ISearchProps) {
	const { t } = useTranslation([NS.common])
	const { highlight } = useThemeContext()
	const [searchInput, setSearchInput] = useState('')

	const handleOnChangeSearch = (text: string) => {
		setSearchInput(text)
		// handle search by username if all contacts have been synced
		if (!hasFullySynced) {
			if (searchResults.length) {
				setSearchResults([])
			}
			return
		}
		// reset search results
		if (!text.length) {
			setContacts(contactsRef.current)
			setSearchResults([])
			return
		}
		// handle npub search
		if (isNpub(text)) {
			const hex = nip19.decode(text).data
			const filtered = contactsRef.current.filter(c => c.hex === hex)
			return setContacts(filtered)
		}
		const filtered = contactsRef.current.filter(c => getNostrUsername(c).toLowerCase().includes(text.toLowerCase()))
		return setContacts(filtered)
	}

	const handleNip50Search = useCallback((text: string) => {
		if (!text.length) {
			return setSearchResults([])
		}
		nostrRef.current?.search(text)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={styles.inputWrap}>
			<TxtInput
				keyboardType='default'
				placeholder={t('searchContacts')}
				value={searchInput}
				onChangeText={text => void handleOnChangeSearch(text)}
				onSubmitEditing={() => void handleNip50Search(searchInput)}
				style={[styles.searchInput]}
			/>
			{/* Submit nip50 search */}
			<TouchableOpacity
				style={styles.submitSearch}
				onPress={() => void handleNip50Search(searchInput)}
			>
				<SearchIcon color={hi[highlight]} />
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	inputWrap: {
		paddingHorizontal: 20,
		marginTop: 10
	},
	searchInput: {
		marginBottom: 20,
		paddingLeft: 20,
		paddingRight: 50,
		paddingVertical: 10,
	},
	submitSearch: {
		position: 'absolute',
		right: 30,
		top: 4,
		justifyContent: 'center',
		alignItems: 'center',
		width: 40,
		height: 40,
		borderRadius: 20,
	},
})