import { CloseIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import type { IContact } from '@model/nostr'
import type { Nostr } from '@nostr/class/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi } from '@styles'
import { createRef, type Dispatch, type SetStateAction, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

import type { ISearchStates } from '.'

interface ISearchProps {
	contactsRef: React.MutableRefObject<IContact[]>
	setContacts: (contacts: IContact[]) => void
	search: ISearchStates
	setSearch: Dispatch<SetStateAction<ISearchStates>>
	nostrRef: React.MutableRefObject<Nostr | undefined>
	isPayment?: boolean
}

export default function Search({
	contactsRef,
	setContacts,
	search,
	setSearch,
	nostrRef,
	isPayment,
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

		<View style={[styles.inputWrap, { paddingRight: isPayment ? s(10) : 0 }]}>
			<TextInput
				ref={inputRef}
				keyboardType={'default'}
				placeholder={t('searchContacts')}
				placeholderTextColor={color.INPUT_PH}
				selectionColor={hi[highlight]}
				cursorColor={hi[highlight]}
				onChangeText={text => void handleOnChangeSearch(text)}
				onSubmitEditing={() => void handleNip50Search(search.input)}
				value={search.input}
				style={[styles.searchInput, { color: color?.TEXT, backgroundColor: color?.INPUT_BG }]}
			/>
			{/* Submit nip50 search */}
			<TouchableOpacity
				style={[styles.submitSearch, { right: isPayment ? s(10) : s(5) }]}
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
		marginTop: '5@vs',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		maxWidth: '100%',
		flex: 1
	},
	searchInput: {
		flex: 1,
		paddingHorizontal: '18@s',
		borderRadius: 50,
		fontSize: '14@vs',
		marginBottom: '10@vs',
		paddingLeft: '20@s',
		paddingRight: '40@s',
		paddingVertical: '10@vs',
	},
	submitSearch: {
		position: 'absolute',
		height: '32@vs',
		paddingHorizontal: '10@s',
	},
})