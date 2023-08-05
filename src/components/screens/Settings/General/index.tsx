import { HamburgerIcon, LanguageIcon, PaletteIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import type { TGeneralSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import SettingsMenuItem from '../MenuItem'

export default function GeneralSettings({ navigation, route }: TGeneralSettingsPageProps) {
	const { t } = useTranslation(['topNav'])
	const { color } = useContext(ThemeContext)
	return (
		<Screen
			screenName={t('general')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<SettingsMenuItem
					txt={t('display', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<PaletteIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Display settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('language', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<LanguageIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Language settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('advancedFunctions', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<HamburgerIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Advanced settings')}
					hasChevron
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	wrap: {
		paddingVertical: 10,
		marginBottom: 20,
	},
})