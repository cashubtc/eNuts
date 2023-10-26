import { GithubIcon, ReadmeIcon, TelegramIcon } from '@comps/Icons'
import LeaveAppModal from '@comps/LeaveAppModal'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import type { TAboutSettingsPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import MenuItem from './MenuItem'

export default function AboutSettings({ navigation }: TAboutSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [visible, setVisible] = useState(false)
	const closeModal = useCallback(() => setVisible(false), [])
	const [url, setUrl] = useState('')
	const handlePress = (url: string) => {
		setVisible(true)
		setUrl(url)
	}
	return (
		<Screen
			screenName={t('about', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView>
				<View style={globals(color).wrapContainer}>
					<MenuItem
						txt={t('readme')}
						icon={<ReadmeIcon color={color.TEXT} />}
						onPress={() => handlePress('https://github.com/cashubtc/eNuts#readme')}
						hasSeparator
					/>
					<MenuItem
						txt={t('githubIssues')}
						icon={<GithubIcon color={color.TEXT} />}
						onPress={() => handlePress('https://github.com/cashubtc/eNuts/issues/new/choose')}
						hasSeparator
					/>
					<MenuItem
						txt={t('enutsRandD')}
						icon={<TelegramIcon color={color.TEXT} />}
						onPress={() => handlePress('https://t.me/eNutsWallet')}
					/>
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<LeaveAppModal url={url} visible={visible} closeModal={closeModal} />
		</Screen>
	)
}
