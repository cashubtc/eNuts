import { BackupIcon, FlagIcon, KeyIcon, LeafIcon, PenIcon, TrashbinIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { globals } from '@styles'
import { isNull, isStr } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { s } from 'react-native-size-matters'

import MenuItem from './MenuItem'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [pin, setPin] = useState<string | null>(null)
	const [hasSeed, setHasSeed] = useState(false)
	const handleBackup = async () => {
		try {
			const proofs = await getProofs()
			if (!proofs.length) {
				openPromptAutoClose({ msg: t('noProofsToBackup') })
				return
			}
			const token = await getBackUpToken()
			navigation.navigate('BackupPage', { token })
		} catch (e) {
			openPromptAutoClose({ msg: t('backupErr') })
		}
	}
	const init = async () => {
		const pinHash = await secureStore.get(SECURESTORE_KEY)
		const restoreCounter = await store.get(STORE_KEYS.restoreCounter)
		setPin(isNull(pinHash) ? '' : pinHash)
		setHasSeed(isStr(restoreCounter))
	}
	useEffect(() => {
		void init()
	}, [])
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = navigation.addListener('focus', async () => {
			await init()
		})
		return focusHandler
	}, [navigation])
	if (isNull(pin)) { return null }
	return (
		<Screen
			screenName={t('security', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.navigate('General settings')}
		>
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					{pin ?
						<>
							<MenuItem
								txt={t('editPin', { ns: NS.auth })}
								icon={<PenIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldEdit: true })}
								hasSeparator
							/>
							<MenuItem
								txt={t('removePin', { ns: NS.auth })}
								icon={<TrashbinIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldRemove: true })}
								hasSeparator
							/>
						</>
						:
						<MenuItem
							txt={t('createPin', { ns: NS.auth })}
							icon={<KeyIcon width={s(20)} height={s(20)} color={color.TEXT} />}
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
							hasSeparator
						/>
					}
					<MenuItem
						txt={hasSeed ? t('walletRecovery') : t('seedBackup')}
						icon={
							hasSeed ?
								<BackupIcon width={s(22)} height={s(22)} color={color.TEXT} />
								:
								<LeafIcon width={s(22)} height={s(22)} color={color.TEXT} />
						}
						onPress={() => {
							if (hasSeed) {
								// TODO skip mint selection if only one mint
								return navigation.navigate('Select recovery mint', {
									comingFromOnboarding: false
								})
							}
							navigation.navigate('Seed')
						}}
						hasSeparator
					/>
					<MenuItem
						txt={t('createBackup')}
						icon={<FlagIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						onPress={() => void handleBackup()}
					/>
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
	)
}
