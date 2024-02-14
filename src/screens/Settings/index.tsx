import { AboutIcon, HeartIcon, MintBoardIcon, OptionsIcon } from '@comps/Icons'
import { ZapModal } from '@comps/modal/Zap'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion, isIOS } from '@consts/env'
import { BottomModal } from '@modal/Question'
import type { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { dropAllData } from '@src/storage/dev'
import { globals } from '@styles'
import * as Updates from 'expo-updates'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, View } from 'react-native'
import { vs } from 'react-native-size-matters'

import MenuItem from './MenuItem'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [confirmReset, setConfirmReset] = useState(false)
	const [zapModal, setZapModal] = useState(false)

	const handleReset = async () => {
		try {
			await dropAllData()
		} catch (e) {/* ignore */ }
		setConfirmReset(false)
		void Updates.reloadAsync()
	}

	return (
		<Screen
			screenName={t('settings', { ns: NS.topNav })}
			noIcons
		>
			<ScrollView alwaysBounceVertical={false} >
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						txt={t('general', { ns: NS.topNav })}
						icon={<OptionsIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('General settings')}
						hasSeparator
						hasChevron
					/>
					<MenuItem
						txt={t('mintSettings', { ns: NS.topNav })}
						icon={<MintBoardIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('mints')}
						hasSeparator
						hasChevron
					/>
					<MenuItem
						txt={t('about', { ns: NS.topNav })}
						icon={<AboutIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('About settings')}
						hasSeparator={__DEV__}
					/>
					{!isIOS &&
						<MenuItem
							txt={t('donateLn')}
							icon={<HeartIcon color={color.TEXT} />}
							onPress={() => setZapModal(true)}
							hasSeparator={__DEV__}
						/>
					}
					{__DEV__ &&
						<MenuItem
							txt={t('factoryReset')}
							icon={<Text>💥💥💥</Text>}
							onPress={() => setConfirmReset(true)}
						/>
					}
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
			<ZapModal visible={zapModal} close={() => setZapModal(false)} />
			{/* confirm factory reset */}
			<BottomModal
				header={t('resetQ')}
				txt={t('delHistoryTxt')}
				visible={confirmReset}
				confirmTxt={t('yes')}
				confirmFn={() => void handleReset()}
				cancelTxt={t('no')}
				cancelFn={() => setConfirmReset(false)}
			/>
		</Screen>
	)
}
