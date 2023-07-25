import type { TAddressBookPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import AddressBook from './Book'

export default function AddressbookPage({ navigation, route }: TAddressBookPageProps) {
	const { t } = useTranslation(['topNav'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={route.params?.isMelt ? t('cashOut', { ns: 'common' }) : t('addressBook')}
				withBackBtn={route.params?.isMelt}
				handlePress={() => navigation.goBack()}
			/>
			<AddressBook nav={{ navigation, route }} />
			{!route.params?.isMelt && <BottomNav navigation={navigation} route={route} />}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0
	},
})