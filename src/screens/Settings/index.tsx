import { AboutIcon, EyeClosedIcon, HamburgerIcon, LockIcon, MintBoardIcon, TrashbinIcon, ZapIcon } from '@comps/Icons'
import { ZapModal } from '@comps/modal/Zap'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import { QuestionModal } from '@modal/Question'
import type { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { dropAllData } from '@src/storage/dev'
import { historyStore, store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, mainColors } from '@styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import SettingsMenuItem from './MenuItem'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [confirm, setConfirm] = useState(false)
	const [confirmReset, setConfirmReset] = useState(false)
	const [zapModal, setZapModal] = useState(false)
	const handleDeleteHistory = async () => {
		const success = await historyStore.clear()
		await store.delete(STORE_KEYS.latestHistory)
		openPromptAutoClose({
			msg: success ? t('historyDeleted') : t('delHistoryErr'),
			success
		})
		setConfirm(false)
	}
	const handleReset = async () => {
		await dropAllData()
		setConfirmReset(false)
		openPromptAutoClose({success: true, msg: t('plsRestart')})
	}
	return (
		<Screen
			screenName={t('settings', { ns: NS.topNav })}
			handlePress={() => navigation.navigate('qr scan', { mint: undefined })}
		>
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<SettingsMenuItem
					txt={t('general', { ns: NS.topNav })}
					txtColor={color.TEXT}
					icon={<HamburgerIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('General settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('mintSettings', { ns: NS.topNav })}
					txtColor={color.TEXT}
					icon={<MintBoardIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('mints')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('security', { ns: NS.topNav })}
					txtColor={color.TEXT}
					icon={<LockIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Security settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('privacy', { ns: NS.topNav })}
					txtColor={color.TEXT}
					icon={<EyeClosedIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Privacy settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('about', { ns: NS.topNav })}
					txtColor={color.TEXT}
					icon={<AboutIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('About settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt='Zap'
					txtColor={mainColors.ZAP}
					icon={<ZapIcon color={mainColors.ZAP} />}
					onPress={() => setZapModal(true)}
					hasSeparator
				/>
				<SettingsMenuItem
					txt={t('delHistory')}
					txtColor={mainColors.ERROR}
					icon={<TrashbinIcon color={mainColors.ERROR} />}
					onPress={() => setConfirm(true)}
					hasSeparator={__DEV__}
				/>
				{__DEV__ &&
					<SettingsMenuItem
						txt={t('factoryReset')}
						txtColor={mainColors.ERROR}
						icon={<Text>💥💥💥</Text>}
						onPress={() => setConfirmReset(true)}
					/>
				}
			</View>
			<Txt txt={appVersion} styles={[styles.version]} />
			<BottomNav navigation={navigation} route={route} />
			<ZapModal visible={zapModal} close={() => setZapModal(false)} />
			{/* confirm history deletion */}
			<QuestionModal
				header={t('delHistoryQ')}
				txt={t('delHistoryTxt')}
				visible={confirm}
				confirmTxt={t('yes')}
				confirmFn={() => void handleDeleteHistory()}
				cancelTxt={t('no')}
				cancelFn={() => setConfirm(false)}
			/>
			{/* confirm factory reset */}
			<QuestionModal
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