import { AboutIcon, EyeClosedIcon, HamburgerIcon, LockIcon, MintBoardIcon, TrashbinIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { QuestionModal } from '@modal/Question'
import type { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { historyStore } from '@store'
import { globals, mainColors } from '@styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { version } from '../../../package.json'
import SettingsMenuItem from './MenuItem'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { t } = useTranslation(['common'])
	const { color } = useThemeContext()
	const [confirm, setConfirm] = useState(false)
	const { openPromptAutoClose } = usePromptContext()
	const handleDeleteHistory = async () => {
		const success = await historyStore.clear()
		openPromptAutoClose({
			msg: success ? t('historyDeleted') : t('delHistoryErr'),
			success
		})
		setConfirm(false)
	}
	return (
		<Screen
			screenName={t('settings', { ns: 'topNav' })}
			handlePress={() => navigation.navigate('qr scan', { mint: undefined })}
		>
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<SettingsMenuItem
					txt={t('general', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<HamburgerIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('General settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('security', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<LockIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Security settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('privacy', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<EyeClosedIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Privacy settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt='Mints'
					txtColor={color.TEXT}
					icon={<MintBoardIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('mints')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('about', { ns: 'topNav' })}
					txtColor={color.TEXT}
					icon={<AboutIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('About settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('delHistory')}
					txtColor={mainColors.ERROR}
					icon={<TrashbinIcon color={mainColors.ERROR} />}
					onPress={() => setConfirm(true)}
				/>
			</View>
			<Txt txt={`eNuts v${version}`} styles={[styles.version]} />
			<BottomNav navigation={navigation} route={route} />
			<QuestionModal
				header={t('delHistoryQ')}
				txt={t('delHistoryTxt')}
				visible={confirm}
				confirmTxt={t('yes')}
				confirmFn={() => void handleDeleteHistory()}
				cancelTxt={t('no')}
				cancelFn={() => setConfirm(false)}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	wrap: {
		paddingVertical: 10,
		marginBottom: 20,
	},
	version: {
		fontWeight: '500',
		textAlign: 'center',
	}
})