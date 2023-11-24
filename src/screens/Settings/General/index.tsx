import { LanguageIcon, PaletteIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import type { TGeneralSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import MenuItem from '../MenuItem'

export default function GeneralSettings({ navigation, route }: TGeneralSettingsPageProps) {
	const { t } = useTranslation([NS.topNav])
	const { color } = useThemeContext()
	return (
		<Screen
			screenName={t('general')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView>
				<View style={globals(color).wrapContainer}>
					<MenuItem
						txt={t('display', { ns: NS.topNav })}
						icon={<PaletteIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Display settings')}
						hasSeparator
						hasChevron
					/>
					<MenuItem
						txt={t('language', { ns: NS.topNav })}
						icon={<LanguageIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Language settings')}
						hasChevron
					/>
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
	)
}
