import type { TAddressBookPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'

import AddressBook from './Book'

export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<AddressBook nav={{ navigation, route }} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 130
	},
})