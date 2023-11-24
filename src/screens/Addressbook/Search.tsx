import { CloseIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import TxtInput from '@comps/TxtInput'
import type { IContact } from '@model/nostr'
import type { Nostr } from '@nostr/class/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi } from '@styles'
import { createRef, type Dispatch, type SetStateAction, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { type TextInput, TouchableOpacity, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

import type { ISearchStates } from '.'

interface ISearchProps {
	contactsRef: React.MutableRefObject<IContact[]>
	setContacts: (contacts: IContact[]) => void
	search: ISearchStates
	setSearch: Dispatch<SetStateAction<ISearchStates>>
	nostrRef: React.MutableRefObject<Nostr | undefined>
}

export default function Search({
	contactsRef,
	setContacts,
	search,
	setSearch,
	nostrRef
}: ISearchProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const inputRef = createRef<TextInput>()
	const lastSearchQuery = useRef('')

	const handleOnChangeSearch = (text: string) => {
		lastSearchQuery.current = ''
		setSearch(prev => ({ ...prev, input: text, hasResults: true, isSearching: false }))
		if (search.results.length || !text.length) {
			setContacts(contactsRef.current)
			return setSearch(prev => ({ ...prev, results: [] }))
		}
	}

	const handleNip50Search = useCallback((text: string) => {
		if (text === lastSearchQuery.current) { return }
		if (!text.length) {
			return setSearch(prev => ({ ...prev, results: [] }))
		}
		setSearch(prev => ({ ...prev, isSearching: true }))
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
				value={search.input}
				onChangeText={text => void handleOnChangeSearch(text)}
				onSubmitEditing={() => void handleNip50Search(search.input)}
				style={[styles.searchInput]}
			/>
			{/* Submit nip50 search */}
			<TouchableOpacity
				style={styles.submitSearch}
				onPress={() => {
					inputRef.current?.blur()
					if (search.results.length) {
						return setSearch(prev => ({ ...prev, input: '', results: [] }))
					}
					void handleNip50Search(search.input)
				}}
			>
				{search.isSearching && !search.results.length && search.input.length > 0 ?
					<Loading color={hi[highlight]} />
					:
					search.results.length ?
						<CloseIcon color={color.INPUT_PH} />
						:
						<SearchIcon color={color.INPUT_PH} />
				}
			</TouchableOpacity>
		</View>
	)
}

const styles = ScaledSheet.create({
	inputWrap: {
		paddingHorizontal: '20@s',
		marginTop: '10@vs',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	searchInput: {
		marginBottom: '20@vs',
		paddingLeft: '20@s',
		paddingRight: '40@s',
		paddingVertical: '10@vs',
	},
	submitSearch: {
		position: 'absolute',
		right: '20@s',
		height: '42@vs',
		paddingHorizontal: '10@s',
	},
})