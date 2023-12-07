import { BookIcon, EyeClosedIcon, LanguageIcon, LockIcon, PaletteIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import type { TGeneralSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import MenuItem from '../MenuItem'

export default function GeneralSettings({ navigation, route }: TGeneralSettingsPageProps) {
	const { t } = useTranslation([NS.topNav])
	const { color } = useThemeContext()
	const { nostr } = useNostrContext()
	return (
		<Screen
			screenName={t('general')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					<MenuItem
						txt={t('display', { ns: NS.topNav })}
						icon={<PaletteIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Display settings')}
						hasSeparator
						hasChevron
					/>
					<MenuItem
						txt={t('privacy', { ns: NS.topNav })}
						icon={<EyeClosedIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Privacy settings')}
						hasSeparator
						hasChevron
					/>
					<MenuItem
						txt={t('security', { ns: NS.topNav })}
						icon={<LockIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Security settings')}
						hasSeparator
						hasChevron
					/>
					{nostr.nutPub.length > 0 &&
						<MenuItem
							txt={t('contacts', { ns: NS.bottomNav })}
							icon={<BookIcon color={color.TEXT} />}
							onPress={() => navigation.navigate('Contacts settings')}
							hasSeparator
							hasChevron
						/>
					}
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
