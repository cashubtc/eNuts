import { CloseIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { IContact } from '@model/nostr'
import type { Nostr } from '@nostr/class/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi } from '@styles'
import { createRef, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, type TextInput, TouchableOpacity, View } from 'react-native'

interface ISearchProps {
	contactsRef: React.MutableRefObject<IContact[]>
	searchInput: string
	setSearchInput: (text: string) => void
	isSearching?: boolean
	setIsSearching: (isSearching: boolean) => void
	searchResults: IContact[]
	setSearchResults: (contacts: IContact[]) => void
	setContacts: (contacts: IContact[]) => void
	setHasResults: (hasResults: boolean) => void
	nostrRef: React.MutableRefObject<Nostr | undefined>
}

export default function Search({
	contactsRef,
	searchInput,
	setSearchInput,
	isSearching,
	setIsSearching,
	setContacts,
	searchResults,
	setSearchResults,
	setHasResults,
	nostrRef
}: ISearchProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const inputRef = createRef<TextInput>()
	const lastSearchQuery = useRef('')

	const handleOnChangeSearch = (text: string) => {
		lastSearchQuery.current = ''
		setSearchInput(text)
		setHasResults(true)
		setIsSearching(false)
		if (searchResults.length || !text.length) {
			setContacts(contactsRef.current)
			return setSearchResults([])
		}
	}

	const handleNip50Search = useCallback((text: string) => {
		if (text === lastSearchQuery.current) { return }
		if (!text.length) {
			return setSearchResults([])
		}
		setIsSearching(true)
		lastSearchQuery.current = text
		nostrRef.current?.search(text)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={styles.inputWrap}>
			<TxtInput
				innerRef={inputRef}
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
				onPress={() => {
					inputRef.current?.blur()
					if (searchResults.length) {
						setSearchResults([])
						return setSearchInput('')
					}
					void handleNip50Search(searchInput)
				}}
			>
				{isSearching && !searchResults.length ?
					<Loading color={hi[highlight]} />
					:
					searchResults.length ?
						<CloseIcon color={color.INPUT_PH} />
						:
						<SearchIcon color={color.INPUT_PH} />
				}
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
		paddingVertical: '4%',
	},
	submitSearch: {
		position: 'absolute',
		right: '7%',
		top: isIOS ? '3%' : '10%',
		justifyContent: 'center',
		alignItems: 'center',
		width: 40,
		height: 40,
		borderRadius: 20,
	},
})